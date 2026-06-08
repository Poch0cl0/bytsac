<?php

namespace Database\Seeders;

use App\Models\Subscription;
use App\Models\Plan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        // Obtenemos los planes para usar su duración real
        $planBasico = Plan::find(1);
        $planPremium = Plan::find(2);

        $subscriptions = [
            [
                'tenant_id' => 1,
                'client_id' => 1,
                'plan_id' => $planBasico->id ?? 1,
                'user_id' => 1,
                'fecha_inicio' => Carbon::now()->startOfDay(),
                // Lógica idéntica al Controller:
                'fecha_fin' => Carbon::now()->startOfDay()->addDays($planBasico->duracion_dias ?? 30),
                'estado' => 'activo',
                'renovacion_automatica' => true,
            ],
            [
                'tenant_id' => 1,
                'client_id' => 2,
                'plan_id' => $planPremium->id ?? 2,
                'user_id' => 1,
                'fecha_inicio' => Carbon::now()->startOfDay(),
                'fecha_fin' => Carbon::now()->startOfDay()->addDays($planPremium->duracion_dias ?? 365),
                'estado' => 'activo',
                'renovacion_automatica' => true,
            ],
        ];

        foreach ($subscriptions as $subscription) {
            Subscription::create($subscription);
        }
    }
}