<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class PlanController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Plan::class);

        // Si usas el Trait BelongsToTenant, el Tenant Scope se aplica automáticamente.
        // Forzamos el filtro de seguridad por si acaso.
        $plans = Plan::query()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->where('activo', true)
            ->orderBy('precio_mensual')
            ->paginate(15);

        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Plan::class);

        $tenantId = auth()->user()->tenant_id;
        $data = $request->validate([
            'nombre' => [
                'required', 'string', 'max:100',
                Rule::unique('plans', 'nombre')->where('tenant_id', $tenantId),
            ],
            'descripcion' => ['nullable', 'string'],
            'precio_mensual' => ['required', 'numeric', 'min:0'],
            'precio_anual' => ['required', 'numeric', 'min:0'],
            'duracion_dias' => ['required', 'integer', 'min:1'],
            'control_ventas_stock' => ['required', 'boolean'],
            'max_usuarios' => ['required', 'integer', 'min:1'],
            'nivel_reportes' => ['required', Rule::in(['basico', 'avanzado', 'premium'])],
            'activo' => ['required', 'boolean'],
        ]);

        $data['tenant_id'] = $tenantId;

        try {
            $plan = Plan::create($data);

            return response()->json($plan, 201);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se pudo registrar el plan. El nombre podría estar repetido.',
                'error' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo registrar el plan.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Plan $plan): JsonResponse
    {
        $this->authorize('view', $plan);
        $this->ensureTenantAccess($plan);
        
        return response()->json($plan);
    }

    public function update(Request $request, Plan $plan): JsonResponse
    {
        $this->authorize('update', $plan);
        $this->ensureTenantAccess($plan);

        $tenantId = auth()->user()->tenant_id;
        $data = $request->validate([
            'nombre' => [
                'required', 'string', 'max:100',
                Rule::unique('plans', 'nombre')->where('tenant_id', $tenantId)->ignore($plan->id),
            ],
            'descripcion' => ['nullable', 'string'],
            'precio_mensual' => ['required', 'numeric', 'min:0'],
            'precio_anual' => ['required', 'numeric', 'min:0'],
            'duracion_dias' => ['required', 'integer', 'min:1'],
            'control_ventas_stock' => ['required', 'boolean'],
            'max_usuarios' => ['required', 'integer', 'min:1'],
            'nivel_reportes' => ['required', Rule::in(['basico', 'avanzado', 'premium'])],
            'activo' => ['required', 'boolean'],
        ]);

        try {
            $plan->update($data);

            return response()->json($plan);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se pudo actualizar el plan. El nombre podría estar repetido.',
                'error' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo actualizar el plan.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Plan $plan): JsonResponse
    {
        $this->authorize('delete', $plan);
        $this->ensureTenantAccess($plan);

        try {
            $plan->delete();
            return response()->json(null, 204);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Unexpected error', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Garantiza protección de datos entre organizaciones.
     */
    protected function ensureTenantAccess(Plan $plan): void
    {
        if ($plan->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'No autorizado. Este objeto pertenece a otra organización.');
        }
    }
}