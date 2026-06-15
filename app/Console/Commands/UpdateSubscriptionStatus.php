<?php

namespace App\Console\Commands;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Subscription;
use App\Services\ActivityLogService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class UpdateSubscriptionStatus extends Command
{
    protected $signature = 'subscriptions:update-status';

    protected $description = 'Actualiza el estado de las suscripciones (por_vencer, vencido, auto-renovación)';

    public function handle(ActivityLogService $activityLogService): int
    {
        $this->info('Iniciando actualización de estados de suscripciones...');
        $now = Carbon::now()->startOfDay();
        $sevenDaysFromNow = $now->copy()->addDays(7)->endOfDay();

        $expiringSoonSubscriptions = Subscription::where('estado', 'activo')
            ->whereBetween('fecha_fin', [$now, $sevenDaysFromNow])
            ->cursor();

        $expiringSoonCount = 0;

        foreach ($expiringSoonSubscriptions as $subscription) {
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

            $expiringSoonCount++;
        }

        $this->info("Suscripciones marcadas como 'por_vencer': {$expiringSoonCount}");

        $expiredSubscriptions = Subscription::where('fecha_fin', '<', $now)
            ->whereIn('estado', ['activo', 'por_vencer'])
            ->with('plan')
            ->cursor();

        $renewedCount = 0;
        $expiredCount = 0;

        foreach ($expiredSubscriptions as $subscription) {
            if ($subscription->renovacion_automatica) {
                $oldValues = [
                    'fecha_fin' => $subscription->fecha_fin?->toDateString(),
                    'estado' => $subscription->estado,
                ];

                $daysToAdd = $subscription->plan->duracion_dias ?? 30;
                $subscription->disableAuditing();
                $subscription->fecha_fin = $subscription->fecha_fin->copy()->addDays($daysToAdd);
                $subscription->estado = $subscription->fecha_fin->lt(now()->addDays(7)) ? 'por_vencer' : 'activo';
                $subscription->saveQuietly();

                $activityLogService->logAsSystem(
                    action: ActivityAction::SystemUpdate->value,
                    module: ActivityModule::System->value,
                    description: "Suscripción #{$subscription->id} renovada automáticamente por el sistema",
                    subject: $subscription,
                    old: $oldValues,
                    new: [
                        'fecha_fin' => $subscription->fecha_fin->toDateString(),
                        'estado' => $subscription->estado,
                    ],
                );

                $renewedCount++;
            } else {
                $oldEstado = $subscription->estado;

                $subscription->disableAuditing();
                $subscription->estado = 'vencido';
                $subscription->saveQuietly();

                $activityLogService->logAsSystem(
                    action: ActivityAction::SystemUpdate->value,
                    module: ActivityModule::System->value,
                    description: "Suscripción #{$subscription->id} marcada automáticamente como vencido",
                    subject: $subscription,
                    old: ['estado' => $oldEstado],
                    new: ['estado' => 'vencido'],
                );

                $expiredCount++;
            }
        }

        $this->info("Suscripciones renovadas automáticamente: {$renewedCount}");
        $this->info("Suscripciones marcadas como 'vencido': {$expiredCount}");
        $this->info('Proceso finalizado correctamente.');

        return 0;
    }
}
