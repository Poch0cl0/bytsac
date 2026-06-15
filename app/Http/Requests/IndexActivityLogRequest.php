<?php

namespace App\Http\Requests;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexActivityLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view activity logs');
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'module' => ['nullable', 'string', Rule::in(ActivityModule::values())],
            'action' => ['nullable', 'string', Rule::in(ActivityAction::values())],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'module.in' => 'El módulo seleccionado no es válido.',
            'action.in' => 'La acción seleccionada no es válida.',
            'date_to.after_or_equal' => 'La fecha final debe ser igual o posterior a la fecha inicial.',
        ];
    }
}
