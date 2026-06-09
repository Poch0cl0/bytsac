<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubscriptionRequest;
use App\Models\Subscription;
use App\Models\Plan;   
use App\Models\Client; 
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Throwable;

class SubscriptionController extends Controller
{
    /**
     * Listar suscripciones con filtros y paginación.
     */
    public function index(Request $request): JsonResponse
    {
        // Vinculación con Policy: Llama a viewAny()
        $this->authorize('viewAny', Subscription::class);
        $tenantId = auth()->user()->tenant_id;

        $query = Subscription::with(['client:id,razon_social', 'plan:id,nombre'])
            ->where('tenant_id', '=', $tenantId);

        if ($request->filled('estado')) {
            $query->where('estado', '=', $request->input('estado'));
        }
        
        if ($request->filled('plan_id')) {
            $query->where('plan_id', '=', $request->input('plan_id'));
        }
        
        if ($request->filled('date_from')) {
            $query->where('fecha_fin', '>=', $request->input('date_from'));
        }
        
        if ($request->filled('date_to')) {
            $query->where('fecha_fin', '<=', $request->input('date_to'));
        }

        $subscriptions = $query->orderBy('fecha_fin', 'asc')->paginate(15);

        return response()->json($subscriptions);
    }

    /**
     * Guardar una nueva suscripción calculando las fechas de forma interna.
     */
    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        // Vinculación con Policy: Llama a create()
        $this->authorize('create', Subscription::class);

        return DB::transaction(function () use ($request) {
            $data = $request->validated();
            $tenantId = auth()->user()->tenant_id;

            // Buscar el plan para obtener los días de duración
            $plan = Plan::where('tenant_id', $tenantId)->findOrFail($data['plan_id']);

            // Automatización de auditoría y cronología
            $data['tenant_id'] = $tenantId;
            $data['user_id'] = auth()->id();
            $data['fecha_inicio'] = now()->startOfDay(); 
            $data['fecha_fin'] = now()->startOfDay()->addDays($plan->duracion_dias);
            $data['estado'] = 'activo';

            $subscription = Subscription::create($data);
            $subscription->load(['client', 'plan']);

            return response()->json($subscription, 201);
        });
    }

    /**
     * NVO ENDPOINT: Ver el detalle de una suscripción específica.
     */
    public function show(Subscription $subscription): JsonResponse
    {
        // Vinculación con Policy: Llama a view()
        $this->authorize('view', $subscription);
        $this->ensureTenantAccess($subscription);

        $subscription->load(['client', 'plan']);
        return response()->json($subscription);
    }

    /**
     * Alternar el switch de renovación automática.
     */
    public function toggleAutoRenew(Subscription $subscription): JsonResponse
    {
        // Vinculación con Policy: Usa la regla 'update' porque altera el registro
        $this->authorize('update', $subscription);
        $this->ensureTenantAccess($subscription);

        try {
            $subscription->renovacion_automatica = !$subscription->renovacion_automatica;
            $subscription->save();

            return response()->json([
                'message' => 'Renovación automática actualizada correctamente.',
                'renovacion_automatica' => $subscription->renovacion_automatica
            ]);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Error inesperado', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Renovar la suscripción extendiendo la fecha de vencimiento (Seguro contra concurrencia).
     */
    public function renew(Subscription $subscription): JsonResponse
    {
        // Vinculación con Policy: Llama a renew()
        $this->authorize('renew', $subscription);
        $this->ensureTenantAccess($subscription);

        return DB::transaction(function () use ($subscription) {
            // Bloqueo de fila para evitar que dos clicks rápidos dupliquen los días
            $subscription->lockForUpdate(); 

            $daysToAdd = $subscription->plan->duracion_dias ?? 30;
            $baseDate = $subscription->fecha_fin->isPast() ? now() : $subscription->fecha_fin;
            
            $subscription->fecha_fin = $baseDate->copy()->addDays($daysToAdd);
            $subscription->estado = 'activo'; 
            $subscription->save();

            return response()->json([
                'message' => 'Suscripción renovada exitosamente.',
                'subscription' => $subscription->fresh(['client', 'plan'])
            ]);
        });
    }

    /**
     * NVO ENDPOINT: Cancelar inmediatamente una suscripción activa.
     */
    public function cancel(Subscription $subscription): JsonResponse
    {
        // Vinculación con Policy: Usa la regla 'update' porque altera el registro
        $this->authorize('update', $subscription);
        $this->ensureTenantAccess($subscription);

        try {
            $subscription->estado = 'cancelado';
            $subscription->renovacion_automatica = false;
            $subscription->save();

            return response()->json([
                'message' => 'Suscripción cancelada de manera inmediata.',
                'subscription' => $subscription->fresh(['client', 'plan'])
            ]);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Error al cancelar la suscripción', 'error' => $e->getMessage()], 500);
        }
    }
    public function destroy($id): JsonResponse
    {
        // Busca el registro sin el TenantScope automático
        $subscription = Subscription::withoutGlobalScopes()->findOrFail($id);
        
        // Vinculación con Policy: Llama a delete()
        $this->authorize('delete', $subscription);

        try {
        // 2. Doble candado de seguridad Multi-Tenant en el controlador
            if ($subscription->tenant_id !== auth()->user()->tenant_id) {
                return response()->json([
                    'message' => 'No autorizado. Este registro pertenece a otra organización.'
            ], 403);
        }

        // 3. Eliminación del registro
        $subscription->delete();

        // 4. Respuesta estándar 204 No Content para eliminaciones exitosas
        return response()->json(null, 204);

        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Unexpected error',
                'error' => $e->getMessage()
            ], 500);
    }
}
    /**
     * Helper interno para encapsular la seguridad Multi-Tenant temporalmente.
     */
    protected function ensureTenantAccess(Subscription $subscription): void
    {
        if ($subscription->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'No autorizado. Esta suscripción pertenece a otra organización.');
        }
    }
}