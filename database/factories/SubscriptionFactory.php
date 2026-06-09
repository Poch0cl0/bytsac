<?php

namespace Database\Factories;

use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => \App\Models\Client::factory(),
            'plan_id' => \App\Models\Plan::factory(),
            'user_id' => \App\Models\User::factory(),
            'fecha_inicio' => now(),
            'fecha_fin' => now()->addMonths(12),
            'estado' => 'activo',
            'renovacion_automatica' => true,
            'tenant_id' => 1,
        ];
    }
}
