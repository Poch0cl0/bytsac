<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Client>
 */
class ClientFactory extends Factory
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
            'razon_social' => $this->faker->company(),
            'ruc' => $this->faker->numerify('##########'),
            'direccion' => $this->faker->address(),
            'telefono' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->companyEmail(),
            'id_usuario_creador' => \App\Models\User::factory(),
            'estado' => 'activo',
        ];
    }
}
