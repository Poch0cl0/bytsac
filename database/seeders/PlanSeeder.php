<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'tenant_id' => 1,
                'nombre' => 'Plan Básico',
                'descripcion' => 'Plan ideal para pequeños negocios',
                'precio_mensual' => 99.00,
                'precio_anual' => 990.00,
                'control_ventas_stock' => false,
                'max_usuarios' => 5,
                'nivel_reportes' => 'basico',
                'activo' => true,
            ],
            [
                'tenant_id' => 1,
                'nombre' => 'Plan Profesional',
                'descripcion' => 'Plan con control de stock y reportes avanzados',
                'precio_mensual' => 199.00,
                'precio_anual' => 1990.00,
                'control_ventas_stock' => true,
                'max_usuarios' => 15,
                'nivel_reportes' => 'avanzado',
                'activo' => true,
            ],
            [
                'tenant_id' => 1,
                'nombre' => 'Plan Enterprise',
                'descripcion' => 'Solución completa con todas las funcionalidades',
                'precio_mensual' => 399.00,
                'precio_anual' => 3990.00,
                'control_ventas_stock' => true,
                'max_usuarios' => 50,
                'nivel_reportes' => 'premium',
                'activo' => true,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}
