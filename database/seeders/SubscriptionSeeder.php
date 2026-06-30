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
        $planBasico = Plan::where('nombre', 'Plan Básico')->where('tenant_id', 1)->first();
        $planPremium = Plan::where('nombre', 'Plan Profesional')->where('tenant_id', 1)->first();

        $subscriptions = [
            [
                'tenant_id' => 1,
                'client_id' => 1,
                'plan_id' => $planBasico->id ?? 1,
                'user_id' => 1,
                'fecha_inicio' => Carbon::now()->startOfDay(),
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
            Subscription::updateOrCreate(
                [
                    'client_id' => $subscription['client_id'],
                    'plan_id' => $subscription['plan_id'],
                    'fecha_inicio' => $subscription['fecha_inicio'],
                ],
                $subscription
            );
        }

        // Suscripción de ejemplo: próxima a vencer (3 días)
        Subscription::updateOrCreate(
            [
                'client_id' => 1,
                'plan_id' => $planBasico->id ?? 1,
                'fecha_inicio' => Carbon::now()->subDays(27)->startOfDay(),
            ],
            [
                'tenant_id' => 1,
                'user_id' => 1,
                'fecha_fin' => Carbon::now()->addDays(3),
                'estado' => 'activo',
                'renovacion_automatica' => false,
            ]
        );

        // Suscripción de ejemplo: ya vencida (5 días atrás)
        Subscription::updateOrCreate(
            [
                'client_id' => 2,
                'plan_id' => $planPremium->id ?? 2,
                'fecha_inicio' => Carbon::now()->subDays(35)->startOfDay(),
            ],
            [
                'tenant_id' => 1,
                'user_id' => 1,
                'fecha_fin' => Carbon::now()->subDays(5),
                'estado' => 'activo',
                'renovacion_automatica' => false,
            ]
        );
    }
}
