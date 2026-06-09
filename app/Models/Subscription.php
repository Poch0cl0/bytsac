<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $client_id
 * @property int $plan_id
 * @property int|null $user_id
 * @property Carbon $fecha_inicio
 * @property Carbon $fecha_fin
 * @property string $estado
 * @property bool $renovacion_automatica
 * @property-read int $dias_restantes
 */
class Subscription extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'client_id',
        'plan_id',
        'user_id',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'renovacion_automatica',
        'tenant_id',
    ];

    // CORRECCIÓN: Permite que 'dias_restantes' se serialice automáticamente en los JSON de la API
    protected $appends = [
        'dias_restantes'
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'renovacion_automatica' => 'boolean',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeProximasAVencer($query, int $dias = 7)
    {
        return $query->where('estado', 'activo')
            ->whereBetween('fecha_fin', [now(), now()->addDays($dias)]);
    }

    public function scopeVencidas($query)
    {
        return $query->whereIn('estado', ['activo', 'por_vencer'])
            ->where('fecha_fin', '<', now()->subDay());
    }

    /**
     * Accessor para calcular los días restantes hasta la fecha_fin.
     */
    protected function diasRestantes(): Attribute
    {
        return Attribute::make(
            get: fn () => max(0, now()->diffInDays($this->fecha_fin, false))
        );
    }
}