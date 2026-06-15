<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SeguimientoVencimiento extends Notification
{
    use Queueable;

    public Subscription $subscription;

    public int $dias_vencido;

    public function __construct(Subscription $subscription, int $dias_vencido)
    {
        $this->subscription = $subscription;
        $this->dias_vencido = $dias_vencido;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'client_id' => $this->subscription->client_id,
            'plan_id' => $this->subscription->plan_id,
            'cliente' => $this->subscription->client->razon_social,
            'plan' => $this->subscription->plan->nombre,
            'fecha_fin' => $this->subscription->fecha_fin->format('Y-m-d'),
            'dias_vencido' => $this->dias_vencido,
            'tipo' => 'seguimiento',
            'mensaje' => "Seguimiento: La suscripción de {$this->subscription->client->razon_social} venció hace {$this->dias_vencido} días. Realiza acciones de recuperación.",
        ];
    }
}
