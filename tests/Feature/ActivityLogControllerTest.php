<?php

namespace Tests\Feature;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::where('email', 'admin@bytsac.pe')->first();
    }

    public function test_login_genera_registro_de_actividad(): void
    {
        $this->postJson('/api/login', [
            'email' => 'admin@bytsac.pe',
            'password' => 'Admin@2026!',
        ])->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'action' => ActivityAction::Login->value,
            'module' => ActivityModule::Auth->value,
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_login_fallido_genera_registro(): void
    {
        $this->postJson('/api/login', [
            'email' => 'admin@bytsac.pe',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $this->assertDatabaseHas('activity_logs', [
            'action' => ActivityAction::LoginFailed->value,
            'module' => ActivityModule::Auth->value,
        ]);
    }

    public function test_crud_cliente_genera_registros_de_auditoria(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/clients', [
                'razon_social' => 'Empresa Audit Test SAC',
                'ruc' => '20123456789',
                'email' => 'audit@test.com',
                'estado' => 'activo',
            ]);

        $response->assertStatus(201);
        $clientId = $response->json('id');

        $this->assertDatabaseHas('activity_logs', [
            'action' => ActivityAction::Created->value,
            'module' => ActivityModule::Clients->value,
            'subject_type' => Client::class,
            'subject_id' => $clientId,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/clients/{$clientId}", [
                'razon_social' => 'Empresa Audit Test Actualizada',
                'ruc' => '20123456789',
                'email' => 'audit@test.com',
                'estado' => 'activo',
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'action' => ActivityAction::Updated->value,
            'module' => ActivityModule::Clients->value,
            'subject_id' => $clientId,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/clients/{$clientId}")
            ->assertStatus(204);

        $this->assertDatabaseHas('activity_logs', [
            'action' => ActivityAction::Deleted->value,
            'module' => ActivityModule::Clients->value,
            'subject_id' => $clientId,
        ]);
    }

    public function test_administrador_puede_listar_activity_logs(): void
    {
        ActivityLog::create([
            'tenant_id' => 1,
            'user_id' => $this->admin->id,
            'user_name' => $this->admin->name,
            'action' => ActivityAction::Login->value,
            'module' => ActivityModule::Auth->value,
            'description' => 'Inicio de sesión exitoso',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/activity-logs');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['action' => ActivityAction::Login->value]);
    }

    public function test_comercial_no_puede_consultar_activity_logs(): void
    {
        $comercial = User::where('email', 'comercial@bytsac.pe')->first();

        $this->actingAs($comercial, 'sanctum')
            ->getJson('/api/activity-logs')
            ->assertStatus(403);
    }

    public function test_puede_filtrar_por_modulo_y_accion(): void
    {
        ActivityLog::create([
            'tenant_id' => 1,
            'user_id' => $this->admin->id,
            'user_name' => $this->admin->name,
            'action' => ActivityAction::Login->value,
            'module' => ActivityModule::Auth->value,
            'description' => 'Login',
            'created_at' => now(),
        ]);

        ActivityLog::create([
            'tenant_id' => 1,
            'user_id' => $this->admin->id,
            'user_name' => $this->admin->name,
            'action' => ActivityAction::Created->value,
            'module' => ActivityModule::Clients->value,
            'description' => 'Cliente creado',
            'created_at' => now(),
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/activity-logs?module=clients&action=created')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['module' => ActivityModule::Clients->value]);
    }

    public function test_aislamiento_por_tenant_en_listado(): void
    {
        ActivityLog::create([
            'tenant_id' => 1,
            'user_id' => $this->admin->id,
            'user_name' => $this->admin->name,
            'action' => ActivityAction::Login->value,
            'module' => ActivityModule::Auth->value,
            'description' => 'Log tenant 1',
            'created_at' => now(),
        ]);

        ActivityLog::withoutGlobalScopes()->create([
            'tenant_id' => 2,
            'user_id' => null,
            'user_name' => 'Sistema',
            'action' => ActivityAction::SystemUpdate->value,
            'module' => ActivityModule::System->value,
            'description' => 'Log tenant 2',
            'created_at' => now(),
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/activity-logs')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['description' => 'Log tenant 1']);
    }

    public function test_administrador_puede_ver_detalle_de_activity_log(): void
    {
        $log = ActivityLog::create([
            'tenant_id' => 1,
            'user_id' => $this->admin->id,
            'user_name' => $this->admin->name,
            'action' => ActivityAction::Renewed->value,
            'module' => ActivityModule::Subscriptions->value,
            'description' => 'Suscripción renovada',
            'created_at' => now(),
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/activity-logs/{$log->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['description' => 'Suscripción renovada']);
    }

    public function test_no_puede_ver_log_de_otro_tenant(): void
    {
        $log = ActivityLog::withoutGlobalScopes()->create([
            'tenant_id' => 99,
            'user_id' => null,
            'user_name' => 'Sistema',
            'action' => ActivityAction::SystemUpdate->value,
            'module' => ActivityModule::System->value,
            'description' => 'Log ajeno',
            'created_at' => now(),
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/activity-logs/{$log->id}")
            ->assertStatus(404);
    }

    public function test_renovacion_genera_log_semantico(): void
    {
        $plan = Plan::factory()->create(['tenant_id' => 1]);
        $client = Client::factory()->create([
            'tenant_id' => 1,
            'id_usuario_creador' => $this->admin->id,
        ]);

        $subscription = \App\Models\Subscription::factory()->create([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'fecha_fin' => now()->subDays(5),
            'estado' => 'vencido',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/subscriptions/{$subscription->id}/renew")
            ->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'action' => ActivityAction::Renewed->value,
            'module' => ActivityModule::Subscriptions->value,
            'subject_type' => \App\Models\Subscription::class,
            'subject_id' => $subscription->id,
        ]);
    }
}
