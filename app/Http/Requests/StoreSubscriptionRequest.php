<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Subscription;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        $tenantId = auth()->user()->tenant_id;

        return [
            // 1. Cliente: Validación Fluent + Control de Duplicados Activos
            'client_id' => [
                'required',
                'integer',
                Rule::exists('clients', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
                // Evita que se cree una segunda suscripción si ya tiene una 'activa'
                function ($attribute, $value, $fail) {
                    $hasActive = Subscription::where('client_id', $value)
                        ->where('estado', 'activo')
                        ->exists();

                    if ($hasActive) {
                        $fail('Este cliente ya cuenta con una suscripción activa en el sistema.');
                    }
                }
            ],

            // 2. Plan: Validación Fluent multi-tenant
            'plan_id' => [
                'required',
                'integer',
                Rule::exists('plans', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            
            // 3. Switch de Renovación
            'renovacion_automatica' => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'Debe seleccionar un cliente obligatoriamente.',
            'client_id.exists' => 'El cliente seleccionado no es válido o no pertenece a tu organización.',
            'plan_id.required' => 'Debe asignar un plan a la suscripción.',
            'plan_id.exists' => 'El plan seleccionado no existe en tu catálogo.',
            'renovacion_automatica.required' => 'El campo de renovación automática es requerido.',
            'renovacion_automatica.boolean' => 'El campo de renovación automática debe ser un valor booleano.',
        ];
    }
}