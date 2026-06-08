<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Ejecutar el seeder de roles y permisos para cada test
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_un_administrador_puede_crear_una_suscripcion(): void
    {
        // Crear usuario admin
        $admin = User::factory()->create(['tenant_id' => 1]);
        $admin->assignRole('administrador');

        // Crear datos necesarios
        $client = Client::create([
            'tenant_id' => 1,
            'razon_social' => 'Cliente Test',
            'ruc' => '20123456789',
            'email' => 'cliente@test.com',
            'estado' => 'activo',
            'id_usuario_creador' => $admin->id,
        ]);

        $plan = Plan::create([
            'tenant_id' => 1,
            'nombre' => 'Plan Básico',
            'descripcion' => 'Plan de prueba',
            'precio_mensual' => 99.00,
            'precio_anual' => 990.00,
            'control_ventas_stock' => false,
            'max_usuarios' => 5,
            'nivel_reportes' => 'basico',
            'activo' => true,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/subscriptions', [
                'client_id' => $client->id,
                'plan_id' => $plan->id,
                'fecha_inicio' => '2024-01-01',
                'fecha_fin' => '2024-12-31',
                'estado' => 'activo',
                'renovacion_automatica' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['estado' => 'activo']);
    }

    public function test_un_cliente_no_puede_crear_suscripciones(): void
    {
        $cliente = User::factory()->create(['tenant_id' => 1]);
        $cliente->assignRole('cliente');

        $client = Client::create([
            'tenant_id' => 1,
            'razon_social' => 'Cliente Test',
            'ruc' => '20123456789',
            'email' => 'cliente2@test.com',
            'estado' => 'activo',
            'id_usuario_creador' => $cliente->id,
        ]);

        $plan = Plan::create([
            'tenant_id' => 1,
            'nombre' => 'Plan Básico 2',
            'descripcion' => 'Plan de prueba',
            'precio_mensual' => 99.00,
            'precio_anual' => 990.00,
            'control_ventas_stock' => false,
            'max_usuarios' => 5,
            'nivel_reportes' => 'basico',
            'activo' => true,
        ]);

        $response = $this->actingAs($cliente, 'sanctum')
            ->postJson('/api/subscriptions', [
                'client_id' => $client->id,
                'plan_id' => $plan->id,
                'fecha_inicio' => '2024-01-01',
                'fecha_fin' => '2024-12-31',
                'estado' => 'activo',
                'renovacion_automatica' => true,
            ]);

        $response->assertStatus(403);
    }

    public function test_no_se_puede_crear_suscripcion_para_otro_tenant(): void
    {
        $admin = User::factory()->create(['tenant_id' => 1]);
        $admin->assignRole('administrador');

        // Cliente de otro tenant
        $otroClient = Client::create([
            'tenant_id' => 99, // Diferente tenant
            'razon_social' => 'Cliente Otro Tenant',
            'ruc' => '20999999999',
            'email' => 'otro@test.com',
            'estado' => 'activo',
            'id_usuario_creador' => $admin->id,
        ]);

        $plan = Plan::create([
            'tenant_id' => 1,
            'nombre' => 'Plan Básico 3',
            'descripcion' => 'Plan de prueba',
            'precio_mensual' => 99.00,
            'precio_anual' => 990.00,
            'control_ventas_stock' => false,
            'max_usuarios' => 5,
            'nivel_reportes' => 'basico',
            'activo' => true,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/subscriptions', [
                'client_id' => $otroClient->id,
                'plan_id' => $plan->id,
                'fecha_inicio' => '2024-01-01',
                'fecha_fin' => '2024-12-31',
                'estado' => 'activo',
                'renovacion_automatica' => true,
            ]);

        // La validación del FormRequest fallará
        $response->assertStatus(422)
            ->assertJsonValidationErrors('client_id');
    }

    public function test_puede_listar_suscripciones_con_filtros(): void
    {
        $admin = User::factory()->create(['tenant_id' => 1]);
        $admin->assignRole('administrador');

        $client = Client::create([
            'tenant_id' => 1,
            'razon_social' => 'Cliente Test',
            'ruc' => '20123456789',
            'email' => 'cliente3@test.com',
            'estado' => 'activo',
            'id_usuario_creador' => $admin->id,
        ]);

        $plan = Plan::create([
            'tenant_id' => 1,
            'nombre' => 'Plan Básico 4',
            'descripcion' => 'Plan de prueba',
            'precio_mensual' => 99.00,
            'precio_anual' => 990.00,
            'control_ventas_stock' => false,
            'max_usuarios' => 5,
            'nivel_reportes' => 'basico',
            'activo' => true,
        ]);

        // Crear 2 suscripciones con diferentes estados
        Subscription::create([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'fecha_inicio' => '2024-01-01',
            'fecha_fin' => '2024-12-31',
            'estado' => 'activo',
            'renovacion_automatica' => true,
        ]);

        Subscription::create([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'fecha_inicio' => '2023-01-01',
            'fecha_fin' => '2023-12-31',
            'estado' => 'vencido',
            'renovacion_automatica' => false,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/subscriptions?estado=activo');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['estado' => 'activo']);
    }

    public function test_puede_alternar_la_renovacion_automatica(): void
    {
        $admin = User::factory()->create(['tenant_id' => 1]);
        $admin->assignRole('administrador');

        $client = Client::create([
            'tenant_id' => 1,
            'razon_social' => 'Cliente Test',
            'ruc' => '20123456789',
            'email' => 'cliente4@test.com',
            'estado' => 'activo',
            'id_usuario_creador' => $admin->id,
        ]);

        $plan = Plan::create([
            'tenant_id' => 1,
            'nombre' => 'Plan Básico 5',
            'descripcion' => 'Plan de prueba',
            'precio_mensual' => 99.00,
            'precio_anual' => 990.00,
            'control_ventas_stock' => false,
            'max_usuarios' => 5,
            'nivel_reportes' => 'basico',
            'activo' => true,
        ]);

        $subscription = Subscription::create([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'fecha_inicio' => '2024-01-01',
            'fecha_fin' => '2024-12-31',
            'estado' => 'activo',
            'renovacion_automatica' => false,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/subscriptions/{$subscription->id}/toggle-auto-renew");

        $response->assertStatus(200)
            ->assertJsonFragment(['renovacion_automatica' => true]);
    }

    public function test_puede_renovar_una_suscripcion(): void
    {
        $admin = User::factory()->create(['tenant_id' => 1]);
        $admin->assignRole('administrador');

        $client = Client::create([
            'tenant_id' => 1,
            'razon_social' => 'Cliente Test',
            'ruc' => '20123456789',
            'email' => 'cliente5@test.com',
            'estado' => 'activo',
            'id_usuario_creador' => $admin->id,
        ]);

        $plan = Plan::create([
            'tenant_id' => 1,
            'nombre' => 'Plan Básico 6',
            'descripcion' => 'Plan de prueba',
            'precio_mensual' => 99.00,
            'precio_anual' => 990.00,
            'control_ventas_stock' => false,
            'max_usuarios' => 5,
            'nivel_reportes' => 'basico',
            'activo' => true,
        ]);

        $subscription = Subscription::create([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'fecha_inicio' => '2024-01-01',
            'fecha_fin' => '2024-01-01', // Ya vencida
            'estado' => 'vencido',
            'renovacion_automatica' => false,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/subscriptions/{$subscription->id}/renew");

        $response->assertStatus(200)
            ->assertJsonFragment(['estado' => 'activo']);

        $subscription->refresh();
        $this->assertEquals('activo', $subscription->estado);
    }
}