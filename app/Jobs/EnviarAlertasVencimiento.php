<?php

namespace App\Jobs;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\AlertaVencimiento;
use App\Notifications\AvisoComercial;
use App\Services\ActivityLogService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class EnviarAlertasVencimiento implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ActivityLogService $activityLogService): void
    {
        $dias = (int) config('app.suscripcion_alerta_dias', 7);

        $proximas = Subscription::proximasAVencer($dias)->with(['client', 'plan'])->get();

        foreach ($proximas as $subscription) {
            $oldEstado = $subscription->estado;

            $subscription->disableAuditing();
            $subscription->estado = 'por_vencer';
            $subscription->saveQuietly();

            $activityLogService->logAsSystem(
                action: ActivityAction::SystemUpdate->value,
                module: ActivityModule::System->value,
                description: "Suscripción #{$subscription->id} marcada automáticamente como por_vencer",
                subject: $subscription,
                old: ['estado' => $oldEstado],
                new: ['estado' => 'por_vencer'],
            );

            if ($subscription->client->email) {
                $subscription->client->notify(new AlertaVencimiento($subscription));
            }

            $comerciales = User::role('comercial')
                ->where('tenant_id', $subscription->tenant_id)
                ->get();

            foreach ($comerciales as $comercial) {
                $comercial->notify(new AvisoComercial($subscription));
            }
        }

        $vencidas = Subscription::vencidas()->with(['client', 'plan'])->get();

        foreach ($vencidas as $subscription) {
            $oldEstado = $subscription->estado;

            $subscription->disableAuditing();
            $subscription->estado = 'expirado';
            $subscription->saveQuietly();

            $activityLogService->logAsSystem(
                action: ActivityAction::SystemUpdate->value,
                module: ActivityModule::System->value,
                description: "Suscripción #{$subscription->id} marcada automáticamente como expirado",
                subject: $subscription,
                old: ['estado' => $oldEstado],
                new: ['estado' => 'expirado'],
            );
        }
    }
}
