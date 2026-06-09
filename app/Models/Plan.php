<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'nombre',
        'descripcion',
        'precio_mensual',
        'precio_anual',
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
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}

