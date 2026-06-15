<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\AvisoComercial;
use App\Services\NotificacionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['tenant_id' => 1]);
        $this->admin->assignRole('administrador');

        $this->otherUser = User::factory()->create(['tenant_id' => 1]);
        $this->otherUser->assignRole('administrador');

        $plan = Plan::factory()->create(['tenant_id' => 1]);

        $client = Client::factory()->create([
            'tenant_id' => 1,
            'id_usuario_creador' => $this->admin->id,
        ]);

        $subscription = Subscription::factory()->create([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'estado' => 'activo',
            'fecha_fin' => now()->addDays(3),
        ]);

        $this->actingAs($this->admin, 'sanctum');

        $service = new NotificacionService();
        $service->procesarVencimientos();

        DB::table('notifications')
            ->where('notifiable_id', $this->otherUser->id)
            ->delete();

        $this->actingAs($this->otherUser, 'sanctum');

        $this->otherUser->notify(new AvisoComercial($subscription));
    }

    public function test_lista_notificaciones_paginadas(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'current_page',
            'last_page',
            'total',
            'per_page',
        ]);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['total' => 1]);
    }

    public function test_conteo_no_leidas(): void
    {
        $response = $this->getJson('/api/notifications/unread-count');

        $response->assertStatus(200);
        $response->assertJson(['unread_count' => 1]);
    }

    public function test_marca_como_leida(): void
    {
        $listResponse = $this->getJson('/api/notifications');
        $notificationId = $listResponse->json('data.0.id');

        $response = $this->patchJson("/api/notifications/{$notificationId}/read");

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Notificación marcada como leída.']);

        $countResponse = $this->getJson('/api/notifications/unread-count');
        $countResponse->assertJson(['unread_count' => 0]);
    }

    public function test_marca_todas_como_leidas(): void
    {
        $response = $this->patchJson('/api/notifications/read-all');

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Todas las notificaciones fueron marcadas como leídas.']);

        $countResponse = $this->getJson('/api/notifications/unread-count');
        $countResponse->assertJson(['unread_count' => 0]);
    }

    public function test_no_puede_marcar_notificacion_de_otro_usuario(): void
    {
        $adminNotif = DB::table('notifications')
            ->where('notifiable_id', $this->admin->id)
            ->first();

        $this->actingAs($this->otherUser, 'sanctum');

        $response = $this->patchJson("/api/notifications/{$adminNotif->id}/read");

        $response->assertStatus(404);
    }

    public function test_no_autenticado_devuelve_401(): void
    {
        $this->app->get('auth')->forgetGuards();

        $response = $this->getJson('/api/notifications');
        $response->assertStatus(401);
    }
}
