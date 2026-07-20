<?php

namespace Tests\Unit;

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\RenewalPredictionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

/**
 * Pruebas unitarias del componente IA (predicción de renovación).
 * Casos alineados a la tabla de pruebas del módulo ML de BYTSAC.
 */
class RenewalPredictionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        $this->admin = User::where('email', 'admin@bytsac.pe')->first();
    }

    /** Nº 1 — Cliente con renovaciones previas: features reflejan historial estable */
    public function test_build_features_con_historial_de_renovaciones(): void
    {
        $subscription = $this->createSubscription([
            'fecha_inicio' => now()->subMonths(18),
            'renovacion_automatica' => true,
        ]);

        ActivityLog::withoutGlobalScopes()->create([
            'tenant_id' => 1,
            'user_id' => $this->admin->id,
            'action' => ActivityAction::Renewed->value,
            'module' => 'subscriptions',
            'subject_type' => Subscription::class,
            'subject_id' => $subscription->id,
            'description' => 'Renovación 1',
            'created_at' => now()->subMonths(6),
        ]);
        ActivityLog::withoutGlobalScopes()->create([
            'tenant_id' => 1,
            'user_id' => $this->admin->id,
            'action' => ActivityAction::Renewed->value,
            'module' => 'subscriptions',
            'subject_type' => Subscription::class,
            'subject_id' => $subscription->id,
            'description' => 'Renovación 2',
            'created_at' => now()->subMonths(3),
        ]);

        $features = app(RenewalPredictionService::class)->buildFeatures($subscription);

        $this->assertSame(2, $features['renovaciones_previas']);
        $this->assertSame(3, $features['cycle_number']);
        $this->assertGreaterThanOrEqual(18, $features['tenure_months']);
        $this->assertSame(1, $features['renovacion_automatica']);
    }

    /** Nº 2 — Cliente sin renovaciones: historial mínimo válido para predicción */
    public function test_build_features_sin_renovaciones_previas(): void
    {
        $subscription = $this->createSubscription([
            'fecha_inicio' => now()->subMonths(2),
        ]);

        $features = app(RenewalPredictionService::class)->buildFeatures($subscription);

        $this->assertSame(0, $features['renovaciones_previas']);
        $this->assertSame(1, $features['cycle_number']);
        $this->assertGreaterThanOrEqual(1, $features['tenure_months']);
    }

    /** Nº 3 — Resumen clasifica niveles alta / media / baja */
    public function test_summarize_cuenta_niveles_de_probabilidad(): void
    {
        $predictions = [
            $this->fakePrediction(0.85, 1, 'alta'),
            $this->fakePrediction(0.55, 1, 'media'),
            $this->fakePrediction(0.22, 0, 'baja'),
            $this->fakePrediction(0.18, 0, 'baja'),
        ];

        $summary = app(RenewalPredictionService::class)->summarize($predictions);

        $this->assertSame(4, $summary['total_analyzed']);
        $this->assertSame(1, $summary['nivel_alta']);
        $this->assertSame(1, $summary['nivel_media']);
        $this->assertSame(2, $summary['nivel_baja']);
        $this->assertSame(2, $summary['prediccion_renovaran']);
        $this->assertSame(2, $summary['prediccion_no_renovaran']);
    }

    /** Nº 4 — Modelo no disponible: error controlado */
    public function test_predict_falla_si_modelo_no_disponible(): void
    {
        config(['ml.enabled' => false]);

        $subscription = $this->createSubscription();
        $service = app(RenewalPredictionService::class);

        $this->assertFalse($service->isAvailable());

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('El modelo de prediccion no esta disponible.');

        $service->predict($subscription);
    }

    /** Nº 5 — Suscripción sin cliente/plan: error controlado */
    public function test_build_features_falla_sin_cliente_o_plan(): void
    {
        $subscription = new Subscription([
            'tenant_id' => 1,
            'fecha_inicio' => now()->subMonth(),
            'fecha_fin' => now()->addMonth(),
        ]);
        $subscription->setRelation('client', null);
        $subscription->setRelation('plan', null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('La suscripcion no tiene cliente o plan asociado.');

        app(RenewalPredictionService::class)->buildFeatures($subscription);
    }

    /** Nº 6 — Dirección nula se normaliza (no aborta la predicción de features) */
    public function test_build_features_normaliza_region_cuando_direccion_es_nula(): void
    {
        $subscription = $this->createSubscription([], ['direccion' => null]);

        $features = app(RenewalPredictionService::class)->buildFeatures($subscription);

        $this->assertSame('Lima', $features['region']);
        $this->assertArrayHasKey('monthly_charges', $features);
        $this->assertArrayHasKey('contract', $features);
        $this->assertArrayHasKey('client_estado', $features);
    }

    /** Extra — Resumen vacío no rompe el servicio */
    public function test_summarize_con_lista_vacia(): void
    {
        $summary = app(RenewalPredictionService::class)->summarize([]);

        $this->assertSame(0, $summary['total_analyzed']);
        $this->assertSame(0.0, $summary['promedio_probabilidad_renovacion']);
        $this->assertSame(0, $summary['nivel_alta']);
    }

    /**
     * @param  array<string, mixed>  $subscriptionAttrs
     * @param  array<string, mixed>  $clientAttrs
     */
    private function createSubscription(array $subscriptionAttrs = [], array $clientAttrs = []): Subscription
    {
        $plan = Plan::factory()->create(['tenant_id' => 1]);
        $client = Client::factory()->create(array_merge([
            'tenant_id' => 1,
            'id_usuario_creador' => $this->admin->id,
        ], $clientAttrs));

        return Subscription::factory()->create(array_merge([
            'tenant_id' => 1,
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'user_id' => $this->admin->id,
        ], $subscriptionAttrs))->load(['client', 'plan']);
    }

    /**
     * @return array<string, mixed>
     */
    private function fakePrediction(float $prob, int $renovara, string $nivel): array
    {
        return [
            'probabilidad_renovacion' => $prob,
            'probabilidad_no_renovacion' => round(1 - $prob, 4),
            'prediccion_renovara' => $renovara,
            'nivel_probabilidad_renovacion' => $nivel,
        ];
    }
}
