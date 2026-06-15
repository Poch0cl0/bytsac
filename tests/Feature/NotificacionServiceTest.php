<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\AvisoComercial;
use App\Notifications\SeguimientoVencimiento;
use App\Services\NotificacionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificacionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $comercial;
    protected User $cliente;
    protected Plan $plan;
    protected Client $client;
    protected NotificacionService $service;

    protected int $tenantId = 42;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['tenant_id' => $this->tenantId]);
        $this->admin->assignRole('administrador');

        $this->comercial = User::factory()->create(['tenant_id' => $this->tenantId]);
        $this->comercial->assignRole('comercial');

        $this->cliente = User::factory()->create(['tenant_id' => $this->tenantId]);
        $this->cliente->assignRole('cliente');

        $this->plan = Plan::factory()->create(['tenant_id' => $this->tenantId]);

        $this->client = Client::factory()->create([
            'tenant_id' => $this->tenantId,
            'id_usuario_creador' => $this->admin->id,
        ]);

        $this->service = new NotificacionService();

        $this->actingAs($this->admin, 'sanctum');
    }

    private function crearSub(array $sobrescribe = []): Subscription
    {
        return Subscription::factory()->create(array_merge([
            'tenant_id' => $this->tenantId,
            'client_id' => $this->client->id,
            'plan_id' => $this->plan->id,
            'estado' => 'activo',
            'fecha_fin' => now()->addDays(3),
            'user_id' => $this->admin->id,
        ], $sobrescribe));
    }

    public function test_envia_alertas_a_admin_y_comercial_cuando_sub_por_vencer(): void
    {
        $subscription = $this->crearSub();

        $this->service->procesarVencimientos();

        $this->assertDatabaseCount('notifications', 2);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
            'type' => AvisoComercial::class,
        ]);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->comercial->id,
            'notifiable_type' => User::class,
            'type' => AvisoComercial::class,
        ]);

        $subscription->refresh();
        $this->assertEquals('por_vencer', $subscription->estado);
        $this->assertNotNull($subscription->ultima_alerta_enviada);
        $this->assertEquals(now()->toDateString(), $subscription->ultima_alerta_enviada);
    }

    public function test_no_envia_alertas_duplicadas(): void
    {
        $this->crearSub();

        $this->service->procesarVencimientos();
        $this->service->procesarVencimientos();

        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_marca_como_expiradas_subs_vencidas(): void
    {
        $subscription = $this->crearSub([
            'fecha_fin' => now()->subDays(2),
        ]);

        $this->service->procesarVencidas();

        $subscription->refresh();
        $this->assertEquals('expirado', $subscription->estado);
    }

    public function test_envia_seguimiento_a_7_dias(): void
    {
        $subscription = $this->crearSub([
            'estado' => 'expirado',
            'fecha_fin' => now()->subDays(5),
        ]);

        $this->service->procesarSeguimientos();

        $this->assertDatabaseCount('notifications', 2);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->admin->id,
            'type' => SeguimientoVencimiento::class,
        ]);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->comercial->id,
            'type' => SeguimientoVencimiento::class,
        ]);

        $subscription->refresh();
        $this->assertNotNull($subscription->seguimiento_7_enviado);
        $this->assertEquals(now()->toDateString(), $subscription->seguimiento_7_enviado);
    }

    public function test_envia_seguimiento_a_30_dias(): void
    {
        $subscription = $this->crearSub([
            'estado' => 'expirado',
            'fecha_fin' => now()->subDays(20),
        ]);

        $this->service->procesarSeguimientos();

        $this->assertDatabaseCount('notifications', 2);

        $subscription->refresh();
        $this->assertNotNull($subscription->seguimiento_30_enviado);
        $this->assertEquals(now()->toDateString(), $subscription->seguimiento_30_enviado);
    }

    public function test_no_envia_seguimientos_duplicados(): void
    {
        $this->crearSub([
            'estado' => 'expirado',
            'fecha_fin' => now()->subDays(5),
        ]);

        $this->service->procesarSeguimientos();
        $this->service->procesarSeguimientos();

        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_no_envia_notificaciones_a_rol_cliente(): void
    {
        Subscription::factory()->create([
            'tenant_id' => 1,
            'client_id' => $this->client->id,
            'plan_id' => $this->plan->id,
            'estado' => 'activo',
            'fecha_fin' => now()->addDays(3),
        ]);

        $this->service->procesarVencimientos();

        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $this->cliente->id,
        ]);
    }

    public function test_respeta_ventana_de_dias_configurable(): void
    {
        config(['app.suscripcion_alerta_dias' => 5]);

        Subscription::factory()->create([
            'tenant_id' => 1,
            'client_id' => $this->client->id,
            'plan_id' => $this->plan->id,
            'estado' => 'activo',
            'fecha_fin' => now()->addDays(10),
        ]);

        $this->service->procesarVencimientos();

        $this->assertDatabaseCount('notifications', 0);
    }
}
