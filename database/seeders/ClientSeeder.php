<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = [
            [
                'tenant_id' => 1,
                'razon_social' => 'Cliente Test BYTSAC',
                'ruc' => '20123456789',
                'direccion' => 'Av. Demo 123, Lima',
                'telefono' => '999888777',
                'email' => 'cliente@test.com',
                'estado' => 'activo',
                'id_usuario_creador' => 1,
            ],
            [
                'tenant_id' => 1,
                'razon_social' => 'Empresa Demo SAC',
                'ruc' => '20987654321',
                'direccion' => 'Jr. Principal 456, Lima',
                'telefono' => '987654321',
                'email' => 'contacto@empresademo.com',
                'estado' => 'activo',
                'id_usuario_creador' => 1,
            ],
        ];

        foreach ($clients as $client) {
            Client::create($client);
        }
    }
}
