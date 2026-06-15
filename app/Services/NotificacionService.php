<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;
use App\Notifications\AvisoComercial;
use App\Notifications\SeguimientoVencimiento;
use Illuminate\Support\Facades\Log;

class NotificacionService
{
    public function ejecutarCicloCompleto(): void
    {
        $this->procesarVencimientos();
        $this->procesarVencidas();
        $this->procesarSeguimientos();
    }

    public function procesarVencimientos(): void
    {
        $dias = (int) config('app.suscripcion_alerta_dias', 7);

        $proximas = Subscription::proximasAVencer($dias)
            ->with(['client', 'plan'])
            ->get();

        foreach ($proximas as $subscription) {
            $subscription->update(['estado' => 'por_vencer']);

            $this->notificar($subscription, 'aviso_comercial');

            $subscription->ultima_alerta_enviada = now()->toDateString();
            $subscription->save();
        }

        if ($proximas->isNotEmpty()) {
            Log::info('NotificacionService: ' . $proximas->count() . ' alertas de vencimiento enviadas.');
        }
    }

    public function procesarVencidas(): void
    {
        $vencidas = Subscription::vencidas()->with(['client', 'plan'])->get();

        foreach ($vencidas as $subscription) {
            $subscription->update(['estado' => 'expirado']);
        }

        if ($vencidas->isNotEmpty()) {
            Log::info('NotificacionService: ' . $vencidas->count() . ' suscripciones marcadas como expiradas.');
        }
    }

    public function procesarSeguimientos(): void
    {
        $hoy = now()->toDateString();

        $seguimiento7 = Subscription::where('estado', 'expirado')
            ->whereNull('seguimiento_7_enviado')
            ->whereBetween('fecha_fin', [now()->subDays(7)->startOfDay(), now()->subDay()->endOfDay()])
            ->with(['client', 'plan'])
            ->get();

        foreach ($seguimiento7 as $subscription) {
            $this->notificar($subscription, 'seguimiento', 7);
            $subscription->seguimiento_7_enviado = $hoy;
            $subscription->save();
        }

        $seguimiento30 = Subscription::where('estado', 'expirado')
            ->whereNull('seguimiento_30_enviado')
            ->whereBetween('fecha_fin', [now()->subDays(30)->startOfDay(), now()->subDays(8)->endOfDay()])
            ->with(['client', 'plan'])
            ->get();

        foreach ($seguimiento30 as $subscription) {
            $this->notificar($subscription, 'seguimiento', 30);
            $subscription->seguimiento_30_enviado = $hoy;
            $subscription->save();
        }

        $total = $seguimiento7->count() + $seguimiento30->count();
        if ($total > 0) {
            Log::info("NotificacionService: {$total} seguimientos enviados (7d: {$seguimiento7->count()}, 30d: {$seguimiento30->count()}).");
        }
    }

    private function notificar(Subscription $subscription, string $tipo, int $dias_vencido = 0): void
    {
        $usuarios = User::role(['comercial', 'administrador'])
            ->where('tenant_id', $subscription->tenant_id)
            ->get();

        foreach ($usuarios as $usuario) {
            $notification = match ($tipo) {
                'aviso_comercial' => new AvisoComercial($subscription),
                'seguimiento' => new SeguimientoVencimiento($subscription, $dias_vencido),
                default => null,
            };

            if ($notification) {
                $usuario->notify($notification);
            }
        }
    }
}
