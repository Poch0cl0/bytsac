<?php

namespace App\Models;

use App\Enums\ActivityModule;
use App\Traits\Auditable;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use Auditable, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'nombre',
        'descripcion',
        'precio_mensual',
        'precio_anual',
        'duracion_dias',
        'control_ventas_stock',
        'max_usuarios',
        'nivel_reportes',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'control_ventas_stock' => 'boolean',
            'activo' => 'boolean',
            'precio_mensual' => 'decimal:2',
            'precio_anual' => 'decimal:2',
            'duracion_dias' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function getAuditModule(): string
    {
        return ActivityModule::Plans->value;
    }

    public function getAuditDescription(string $action): string
    {
        $nombre = $this->nombre ?? 'sin nombre';

        return match ($action) {
            'created' => "Plan \"{$nombre}\" creado",
            'updated' => "Plan \"{$nombre}\" actualizado",
            'deleted' => "Plan \"{$nombre}\" eliminado",
            default => "Plan \"{$nombre}\": {$action}",
        };
    }
}

