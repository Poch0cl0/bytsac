<?php

namespace App\Http\Controllers\Api;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubscriptionRequest;
use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\ActivityLogService;
use App\Services\RenewalPredictionService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
        private readonly RenewalPredictionService $renewalPredictionService,
    ) {}

    /**
     * Listar suscripciones con filtros y paginación.
     */
    public function index(Request $request): JsonResponse
    {
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
        $this->authorize('create', Subscription::class);

        return DB::transaction(function () use ($request) {
            $data = $request->validated();
            $tenantId = auth()->user()->tenant_id;

            $plan = Plan::where('tenant_id', $tenantId)->findOrFail($data['plan_id']);

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
     * Ver el detalle de una suscripción específica.
     */
    public function show(Subscription $subscription): JsonResponse
    {
        $this->authorize('view', $subscription);
        $this->ensureTenantAccess($subscription);

        $subscription->load(['client', 'plan']);

        return response()->json($subscription);
    }

    /**
     * Predicciones IA para todas las suscripciones del tenant (resumen + detalle).
     */
    public function renewalPredictions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Subscription::class);

        if (! $this->renewalPredictionService->isAvailable()) {
            return response()->json([
                'available' => false,
                'message' => 'El servicio de predicción no está disponible. Entrena el modelo con: python ml/scripts/train_model.py',
            ], 503);
        }

        try {
            $predictions = $this->renewalPredictionService->predictForTenant(
                auth()->user()->tenant_id
            );

            $summary = $this->renewalPredictionService->summarize($predictions);

            $payload = [
                'available' => true,
                'message' => 'Predicciones generadas correctamente.',
                'summary' => $summary,
            ];

            if (! $request->boolean('summary_only')) {
                $payload['predictions'] = array_map(
                    fn (array $prediction) => $this->formatPredictionPayload($prediction),
                    $predictions
                );
            }

            return response()->json($payload);
        } catch (Throwable $e) {
            Log::error('Error en predicciones IA', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'available' => false,
                'message' => 'No se pudieron generar las predicciones.',
                'error' => 'Verifica que Python y el modelo ML esten instalados (pip install -r ml/requirements.txt).',
            ], 500);
        }
    }

    /**
     * Predicción IA: probabilidad de que el cliente renueve la suscripción.
     */
    public function renewalPrediction(Subscription $subscription): JsonResponse
    {
        $this->authorize('view', $subscription);
        $this->ensureTenantAccess($subscription);

        if (! $this->renewalPredictionService->isAvailable()) {
            return response()->json([
                'message' => 'El servicio de predicción no está disponible. Entrena el modelo con: python ml/scripts/train_model.py',
            ], 503);
        }

        try {
            $prediction = $this->renewalPredictionService->predict($subscription);

            return response()->json([
                'message' => 'Predicción generada correctamente.',
                'prediction' => $this->formatPredictionPayload($prediction),
            ]);
        } catch (Throwable $e) {
            Log::error('Error en prediccion IA individual', [
                'subscription_id' => $subscription->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'No se pudo generar la predicción.',
                'error' => 'Verifica que Python y el modelo ML esten instalados.',
            ], 500);
        }
    }

    /**
     * Alternar el switch de renovación automática.
     */
    public function toggleAutoRenew(Subscription $subscription): JsonResponse
    {
        $this->authorize('update', $subscription);
        $this->ensureTenantAccess($subscription);

        try {
            $oldValue = $subscription->renovacion_automatica;
            $newValue = ! $oldValue;

            $subscription->disableAuditing();
            $subscription->renovacion_automatica = $newValue;
            $subscription->saveQuietly();

            $estado = $newValue ? 'activada' : 'desactivada';
            $this->activityLogService->log(
                action: ActivityAction::ToggleAutoRenew->value,
                module: ActivityModule::Subscriptions->value,
                description: "Renovación automática {$estado} en suscripción #{$subscription->id}",
                subject: $subscription,
                old: ['renovacion_automatica' => $oldValue],
                new: ['renovacion_automatica' => $newValue],
            );

            return response()->json([
                'message' => 'Renovación automática actualizada correctamente.',
                'renovacion_automatica' => $newValue,
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
        $this->authorize('renew', $subscription);
        $this->ensureTenantAccess($subscription);

        return DB::transaction(function () use ($subscription) {
            $subscription->lockForUpdate();

            $oldValues = [
                'fecha_fin' => $subscription->fecha_fin?->toDateString(),
                'estado' => $subscription->estado,
            ];

            $daysToAdd = $subscription->plan->duracion_dias ?? 30;
            $baseDate = $subscription->fecha_fin->isPast() ? now() : $subscription->fecha_fin;

            $subscription->disableAuditing();
            $subscription->fecha_fin = $baseDate->copy()->addDays($daysToAdd);
            $subscription->estado = 'activo';
            $subscription->saveQuietly();

            $this->activityLogService->log(
                action: ActivityAction::Renewed->value,
                module: ActivityModule::Subscriptions->value,
                description: "Suscripción #{$subscription->id} renovada hasta {$subscription->fecha_fin->toDateString()}",
                subject: $subscription,
                old: $oldValues,
                new: [
                    'fecha_fin' => $subscription->fecha_fin->toDateString(),
                    'estado' => $subscription->estado,
                ],
            );

            return response()->json([
                'message' => 'Suscripción renovada exitosamente.',
                'subscription' => $subscription->fresh(['client', 'plan']),
            ]);
        });
    }

    /**
     * Cancelar inmediatamente una suscripción activa.
     */
    public function cancel(Subscription $subscription): JsonResponse
    {
        $this->authorize('update', $subscription);
        $this->ensureTenantAccess($subscription);

        try {
            $oldValues = [
                'estado' => $subscription->estado,
                'renovacion_automatica' => $subscription->renovacion_automatica,
            ];

            $subscription->disableAuditing();
            $subscription->estado = 'cancelado';
            $subscription->renovacion_automatica = false;
            $subscription->saveQuietly();

            $this->activityLogService->log(
                action: ActivityAction::Cancelled->value,
                module: ActivityModule::Subscriptions->value,
                description: "Suscripción #{$subscription->id} cancelada",
                subject: $subscription,
                old: $oldValues,
                new: [
                    'estado' => 'cancelado',
                    'renovacion_automatica' => false,
                ],
            );

            return response()->json([
                'message' => 'Suscripción cancelada de manera inmediata.',
                'subscription' => $subscription->fresh(['client', 'plan']),
            ]);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Error al cancelar la suscripción', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        $subscription = Subscription::withoutGlobalScopes()->findOrFail($id);

        $this->authorize('delete', $subscription);

        try {
            if ($subscription->tenant_id !== auth()->user()->tenant_id) {
                return response()->json([
                    'message' => 'No autorizado. Este registro pertenece a otra organización.',
                ], 403);
            }

            $subscription->delete();

            return response()->json(null, 204);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Unexpected error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    protected function ensureTenantAccess(Subscription $subscription): void
    {
        if ($subscription->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'No autorizado. Esta suscripción pertenece a otra organización.');
        }
    }

    /**
     * @param  array<string, mixed>  $prediction
     * @return array<string, mixed>
     */
    protected function formatPredictionPayload(array $prediction): array
    {
        return [
            'subscription_id' => $prediction['subscription_id'] ?? null,
            'client_id' => $prediction['client_id'] ?? null,
            'client_name' => $prediction['client_name'] ?? null,
            'plan_name' => $prediction['plan_name'] ?? null,
            'estado' => $prediction['estado'] ?? null,
            'fecha_fin' => $prediction['fecha_fin'] ?? null,
            'dias_restantes' => $prediction['dias_restantes'] ?? null,
            'probabilidad_renovacion' => $prediction['probabilidad_renovacion'],
            'probabilidad_no_renovacion' => $prediction['probabilidad_no_renovacion'],
            'prediccion_renovara' => (bool) $prediction['prediccion_renovara'],
            'nivel_probabilidad_renovacion' => $prediction['nivel_probabilidad_renovacion'],
        ];
    }
}
