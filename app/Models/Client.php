<?php

namespace App\Models;

use App\Enums\ActivityModule;
use App\Traits\Auditable;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class Client extends Model
{
    use Auditable, BelongsToTenant, HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'razon_social',
        'ruc',
        'direccion',
        'telefono',
        'email',
        'id_usuario_creador',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'estado' => 'string',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario_creador');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function getAuditModule(): string
    {
        return ActivityModule::Clients->value;
    }

    public function getAuditDescription(string $action): string
    {
        $nombre = $this->razon_social ?? 'sin nombre';

        return match ($action) {
            'created' => "Cliente \"{$nombre}\" creado",
            'updated' => "Cliente \"{$nombre}\" actualizado",
            'deleted' => "Cliente \"{$nombre}\" eliminado",
            default => "Cliente \"{$nombre}\": {$action}",
        };
    }
}

