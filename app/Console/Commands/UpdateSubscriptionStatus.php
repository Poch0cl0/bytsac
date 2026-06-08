<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class UpdateSubscriptionStatus extends Command
{
    protected $signature = 'subscriptions:update-status';
    protected $description = 'Actualiza el estado de las suscripciones (por_vencer, vencido, auto-renovación)';

    public function handle(): int
    {
        $this->info('Iniciando actualización de estados de suscripciones...');
        $now = Carbon::now()->startOfDay();
        $sevenDaysFromNow = $now->copy()->addDays(7)->endOfDay();

        // 1. Marcar como 'por_vencer'
        $expiringSoon = Subscription::where('estado', 'activo')
            ->whereBetween('fecha_fin', [$now, $sevenDaysFromNow])
            ->update(['estado' => 'por_vencer']);
        
        $this->info("Suscripciones marcadas como 'por_vencer': {$expiringSoon}");

        // 2. Procesar suscripciones vencidas
        $expiredSubscriptions = Subscription::where('fecha_fin', '<', $now)
            ->whereIn('estado', ['activo', 'por_vencer'])
            ->with('plan')
            ->cursor();

        $renewedCount = 0;
        $expiredCount = 0;

        foreach ($expiredSubscriptions as $subscription) {
            if ($subscription->renovacion_automatica) {
                $daysToAdd = $subscription->plan->duracion_dias ?? 30;
                
                // El IDE ahora reconoce copy() y addDays() gracias al Docblock del modelo
                $subscription->fecha_fin = $subscription->fecha_fin->copy()->addDays($daysToAdd);
                
                // Usamos now()->addDays(7) para una comparación de Carbon limpia
                $subscription->estado = $subscription->fecha_fin->lt(now()->addDays(7)) ? 'por_vencer' : 'activo';
                $subscription->save();
                
                $renewedCount++;
            } else {
                $subscription->estado = 'vencido';
                $subscription->save();
                
                $expiredCount++;
            }
        }

        $this->info("Suscripciones renovadas automáticamente: {$renewedCount}");
        $this->info("Suscripciones marcadas como 'vencido': {$expiredCount}");
        $this->info('Proceso finalizado correctamente.');

        // Retornar 0 es el estándar POSIX para "éxito" y evita advertencias de linters estrictos
        return 0; 
    }
}
