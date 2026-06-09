<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => 1,
            'nombre' => $this->faker->word(),
            'descripcion' => $this->faker->sentence(),
            'precio_mensual' => $this->faker->randomFloat(2, 10, 500),
            'precio_anual' => $this->faker->randomFloat(2, 100, 5000),
            'control_ventas_stock' => $this->faker->boolean(),
            'max_usuarios' => $this->faker->numberBetween(1, 100),
            'nivel_reportes' => $this->faker->randomElement(['basico', 'avanzado', 'premium']),
            'activo' => true,
        ];
    }
}
