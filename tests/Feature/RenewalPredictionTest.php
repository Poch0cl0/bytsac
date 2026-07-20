<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\RenewalPredictionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class RenewalPredictionTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::where('email', 'admin@bytsac.pe')->first();
    }

    public function test_endpoint_requiere_autenticacion(): void
    {
        $subscription = $this->createSubscription();

        $this->getJson("/api/subscriptions/{$subscription->id}/renewal-prediction")
            ->assertUnauthorized();
    }

    public function test_usuario_autorizado_puede_solicitar_prediccion(): void
    {
        if (! File::exists(config('ml.model_path'))) {
            $this->markTestSkipped('Modelo ML no entrenado.');
        }

        $subscription = $this->createSubscription();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/subscriptions/{$subscription->id}/renewal-prediction");

        if ($response->status() === 503) {
            $this->markTestSkipped('Servicio ML no disponible en este entorno.');
        }

        $response->assertOk()
            ->assertJsonStructure([
                'message',
                'prediction' => [
                    'probabilidad_renovacion',
                    'probabilidad_no_renovacion',
                    'prediccion_renovara',
                    'nivel_probabilidad_renovacion',
                    'subscription_id',
                    'client_id',
                ],
            ]);
    }

    public function test_servicio_construye_features_desde_suscripcion(): void
    {
        $subscription = $this->createSubscription();
        $service = app(RenewalPredictionService::class);

        $features = $service->buildFeatures($subscription);

        $this->assertArrayHasKey('tenure_months', $features);
        $this->assertArrayHasKey('monthly_charges', $features);
        $this->assertArrayHasKey('renovacion_automatica', $features);
        $this->assertSame($subscription->client->estado, $features['client_estado']);
    }

    public function test_puede_obtener_predicciones_batch_y_resumen(): void
    {
        if (! File::exists(config('ml.model_path'))) {
            $this->markTestSkipped('Modelo ML no entrenado.');
        }

        $this->createSubscription();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/subscriptions/renewal-predictions');

        if ($response->status() === 503) {
            $this->markTestSkipped('Servicio ML no disponible en este entorno.');
        }

        $response->assertOk()
            ->assertJsonStructure([
                'available',
                'summary' => [
                    'total_analyzed',
                    'promedio_probabilidad_renovacion',
                    'prediccion_renovaran',
                    'prediccion_no_renovaran',
                ],
                'predictions',
            ]);
    }

    public function test_puede_obtener_solo_resumen_ia(): void
    {
        if (! File::exists(config('ml.model_path'))) {
            $this->markTestSkipped('Modelo ML no entrenado.');
        }

        $this->createSubscription();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/subscriptions/renewal-predictions?summary_only=1');

        if ($response->status() === 503) {
            $this->markTestSkipped('Servicio ML no disponible en este entorno.');
        }

        $response->assertOk()
            ->assertJsonStructure(['summary'])
            ->assertJsonMissingPath('predictions');
    }

    /** Predicción por ID de suscripción: categoría alta|media|baja asignada */
    public function test_prediccion_asigna_nivel_de_probabilidad_valido(): void
    {
        if (! File::exists(config('ml.model_path'))) {
            $this->markTestSkipped('Modelo ML no entrenado.');
        }

        $subscription = $this->createSubscription();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/subscriptions/{$subscription->id}/renewal-prediction");

        if ($response->status() === 503) {
            $this->markTestSkipped('Servicio ML no disponible en este entorno.');
        }

        $response->assertOk();

        $nivel = $response->json('prediction.nivel_probabilidad_renovacion');
        $prob = $response->json('prediction.probabilidad_renovacion');

        $this->assertContains($nivel, ['alta', 'media', 'baja']);
        $this->assertIsNumeric($prob);
        $this->assertGreaterThanOrEqual(0, $prob);
        $this->assertLessThanOrEqual(1, $prob);
    }

    /** Modelo deshabilitado: API responde error controlado 503 */
    public function test_api_responde_503_si_modelo_no_disponible(): void
    {
        config(['ml.enabled' => false]);

        $subscription = $this->createSubscription();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/subscriptions/{$subscription->id}/renewal-prediction")
            ->assertStatus(503);
    }

    private function createSubscription(): Subscription
    {
        $plan = Plan::factory()->create(['tenant_id' => 1]);
        $client = Client::factory()->create([
            'tenant_id' => 1,
            'id_usuario_creador' => $this->admin->id,
        ]);

        return Subscription::factory()->create([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'user_id' => $this->admin->id,
        ]);
    }
}
