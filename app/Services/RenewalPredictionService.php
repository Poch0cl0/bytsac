<?php

namespace App\Services;

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\Subscription;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use JsonException;
use RuntimeException;

class RenewalPredictionService
{
    public function isAvailable(): bool
    {
        if (! config('ml.enabled')) {
            return false;
        }

        return File::exists(config('ml.model_path'))
            && File::exists(config('ml.predict_script'));
    }

    /**
     * @return array<string, mixed>
     */
    public function predict(Subscription $subscription): array
    {
        if (! $this->isAvailable()) {
            throw new RuntimeException('El modelo de prediccion no esta disponible.');
        }

        $subscription->loadMissing(['client', 'plan']);

        $predictions = $this->predictMany(collect([$subscription]));

        return $this->sanitizePrediction($predictions[0]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function predictForTenant(int $tenantId): array
    {
        if (! $this->isAvailable()) {
            throw new RuntimeException('El modelo de prediccion no esta disponible.');
        }

        $subscriptions = Subscription::query()
            ->with(['client:id,razon_social,estado,direccion', 'plan:id,nombre,precio_mensual,duracion_dias,nivel_reportes,control_ventas_stock'])
            ->where('tenant_id', $tenantId)
            ->orderBy('fecha_fin')
            ->get();

        return array_map(
            fn (array $prediction) => $this->sanitizePrediction($prediction),
            $this->predictMany($subscriptions)
        );
    }

    /**
     * @param  list<array<string, mixed>>  $predictions
     * @return array<string, mixed>
     */
    public function summarize(array $predictions): array
    {
        if ($predictions === []) {
            return [
                'total_analyzed' => 0,
                'promedio_probabilidad_renovacion' => 0.0,
                'prediccion_renovaran' => 0,
                'prediccion_no_renovaran' => 0,
                'nivel_alta' => 0,
                'nivel_media' => 0,
                'nivel_baja' => 0,
            ];
        }

        $probabilities = array_column($predictions, 'probabilidad_renovacion');

        return [
            'total_analyzed' => count($predictions),
            'promedio_probabilidad_renovacion' => round(array_sum($probabilities) / count($probabilities), 4),
            'prediccion_renovaran' => count(array_filter($predictions, fn (array $item) => (bool) $item['prediccion_renovara'])),
            'prediccion_no_renovaran' => count(array_filter($predictions, fn (array $item) => ! (bool) $item['prediccion_renovara'])),
            'nivel_alta' => count(array_filter($predictions, fn (array $item) => $item['nivel_probabilidad_renovacion'] === 'alta')),
            'nivel_media' => count(array_filter($predictions, fn (array $item) => $item['nivel_probabilidad_renovacion'] === 'media')),
            'nivel_baja' => count(array_filter($predictions, fn (array $item) => $item['nivel_probabilidad_renovacion'] === 'baja')),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function predictMany(Collection $subscriptions): array
    {
        if ($subscriptions->isEmpty()) {
            return [];
        }

        $featuresList = [];
        $metadata = [];

        foreach ($subscriptions as $subscription) {
            if ($subscription->client === null || $subscription->plan === null) {
                continue;
            }

            $featuresList[] = $this->buildFeatures($subscription);
            $metadata[] = [
                'subscription_id' => $subscription->id,
                'client_id' => $subscription->client_id,
                'client_name' => $subscription->client->razon_social,
                'plan_name' => $subscription->plan->nombre,
                'estado' => $subscription->estado,
                'fecha_fin' => $subscription->fecha_fin?->toDateString(),
                'dias_restantes' => max(0, (int) $subscription->dias_restantes),
            ];
        }

        if ($featuresList === []) {
            return [];
        }

        $rawPredictions = $this->runPredictionsBatch($featuresList);

        $results = [];

        foreach ($rawPredictions as $index => $prediction) {
            $results[] = array_merge($prediction, $metadata[$index] ?? []);
        }

        return $results;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildFeatures(Subscription $subscription): array
    {
        $client = $subscription->client;
        $plan = $subscription->plan;

        if ($client === null || $plan === null) {
            throw new RuntimeException('La suscripcion no tiene cliente o plan asociado.');
        }

        $tenureMonths = max(1, (int) $subscription->fecha_inicio->diffInMonths(now()));
        $renovacionesPrevias = $this->countPreviousRenewals($subscription);
        $duracionDias = (int) ($plan->duracion_dias ?? 30);

        return [
            'cycle_number' => $renovacionesPrevias + 1,
            'tenure_months' => $tenureMonths,
            'contract' => $this->resolveContractType($duracionDias),
            'monthly_charges' => (float) $plan->precio_mensual,
            'total_charges' => round((float) $plan->precio_mensual * $tenureMonths, 2),
            'payment_method' => 'transferencia',
            'paperless_billing' => 0,
            'nivel_reportes' => (string) $plan->nivel_reportes,
            'control_stock' => $plan->control_ventas_stock ? 1 : 0,
            'duracion_ciclo_dias' => $duracionDias,
            'dias_restantes_al_corte' => max(0, (int) $subscription->dias_restantes),
            'renovacion_automatica' => $subscription->renovacion_automatica ? 1 : 0,
            'alertas_enviadas' => $subscription->ultima_alerta_enviada ? 1 : 0,
            'renovaciones_previas' => $renovacionesPrevias,
            'region' => $this->resolveRegion($client->direccion),
            'client_estado' => (string) $client->estado,
            'partner' => 'no',
            'dependents' => 'no',
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $featuresList
     * @return list<array<string, mixed>>
     */
    private function runPredictionsBatch(array $featuresList): array
    {
        if ($featuresList === []) {
            return [];
        }

        $decoded = $this->executePredictScript(
            count($featuresList) === 1 ? $featuresList[0] : $featuresList
        );

        if (array_is_list($decoded)) {
            /** @var list<array<string, mixed>> $decoded */
            return $decoded;
        }

        /** @var array<string, mixed> $decoded */
        return [$decoded];
    }

    /**
     * @return array<string, mixed>|list<array<string, mixed>>
     */
    private function executePredictScript(array $payload): array
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'bytsac_ml_');

        if ($tempFile === false) {
            throw new RuntimeException('No se pudo crear archivo temporal para la prediccion.');
        }

        File::put($tempFile, json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));

        try {
            $scriptPath = config('ml.predict_script');
            $environment = $this->buildProcessEnvironment();

            if (PHP_OS_FAMILY === 'Windows') {
                $command = sprintf(
                    'py -3 %s --input-file %s',
                    escapeshellarg($scriptPath),
                    escapeshellarg($tempFile)
                );

                $result = Process::timeout(120)
                    ->path(base_path())
                    ->env($environment)
                    ->run($command);
            } else {
                $command = array_merge(
                    [config('ml.python_binary')],
                    config('ml.python_args', []),
                    [$scriptPath, '--input-file', $tempFile]
                );

                $result = Process::timeout(120)
                    ->path(base_path())
                    ->env($environment)
                    ->run($command);
            }

            if (! $result->successful()) {
                $details = $this->sanitizeUtf8(trim($result->errorOutput() ?: $result->output()));

                Log::error('Fallo al ejecutar modelo ML', [
                    'details' => $details,
                ]);

                throw new RuntimeException(
                    'No se pudo ejecutar el script de prediccion. Verifica Python y las dependencias ML.'
                );
            }

            $output = trim($this->sanitizeUtf8($result->output()));

            if ($output === '') {
                throw new RuntimeException('El script de prediccion no devolvio resultados.');
            }

            return json_decode($output, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('La respuesta del modelo no es JSON valido.');
        } finally {
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $prediction
     * @return array<string, mixed>
     */
    private function sanitizePrediction(array $prediction): array
    {
        return [
            'subscription_id' => isset($prediction['subscription_id']) ? (int) $prediction['subscription_id'] : null,
            'client_id' => isset($prediction['client_id']) ? (int) $prediction['client_id'] : null,
            'client_name' => isset($prediction['client_name']) ? $this->sanitizeUtf8((string) $prediction['client_name']) : null,
            'plan_name' => isset($prediction['plan_name']) ? $this->sanitizeUtf8((string) $prediction['plan_name']) : null,
            'estado' => isset($prediction['estado']) ? $this->sanitizeUtf8((string) $prediction['estado']) : null,
            'fecha_fin' => isset($prediction['fecha_fin']) ? $this->sanitizeUtf8((string) $prediction['fecha_fin']) : null,
            'dias_restantes' => isset($prediction['dias_restantes']) ? (int) $prediction['dias_restantes'] : null,
            'probabilidad_renovacion' => round((float) ($prediction['probabilidad_renovacion'] ?? 0), 4),
            'probabilidad_no_renovacion' => round((float) ($prediction['probabilidad_no_renovacion'] ?? 0), 4),
            'prediccion_renovara' => (int) ($prediction['prediccion_renovara'] ?? 0),
            'nivel_probabilidad_renovacion' => $this->sanitizeUtf8((string) ($prediction['nivel_probabilidad_renovacion'] ?? 'baja')),
        ];
    }

    private function buildProcessEnvironment(): array
    {
        $environment = getenv();

        if (! is_array($environment)) {
            $environment = [];
        }

        foreach ($_ENV as $key => $value) {
            if (is_string($key) && is_string($value)) {
                $environment[$key] = $value;
            }
        }

        foreach ($_SERVER as $key => $value) {
            if (is_string($key) && is_string($value) && ! isset($environment[$key])) {
                $environment[$key] = $value;
            }
        }

        $fallbacks = [
            'SystemRoot' => 'C:\\Windows',
            'WINDIR' => 'C:\\Windows',
            'COMSPEC' => 'C:\\Windows\\system32\\cmd.exe',
        ];

        foreach ($fallbacks as $key => $value) {
            if (empty($environment[$key])) {
                $environment[$key] = $value;
            }
        }

        $environment['PYTHONIOENCODING'] = 'utf-8';
        $environment['PYTHONUTF8'] = '1';

        return $environment;
    }

    private function sanitizeUtf8(string $value): string
    {
        $clean = mb_convert_encoding($value, 'UTF-8', 'UTF-8');

        if ($clean === false || $clean === '') {
            return '';
        }

        return $clean;
    }

    private function countPreviousRenewals(Subscription $subscription): int
    {
        return ActivityLog::withoutGlobalScopes()
            ->where('subject_type', Subscription::class)
            ->where('subject_id', $subscription->id)
            ->where('action', ActivityAction::Renewed->value)
            ->count();
    }

    private function resolveContractType(int $duracionDias): string
    {
        if ($duracionDias <= 31) {
            return 'mensual';
        }

        if ($duracionDias <= 365) {
            return 'anual';
        }

        return 'enterprise';
    }

    private function resolveRegion(?string $direccion): string
    {
        if ($direccion === null || $direccion === '') {
            return 'Lima';
        }

        $direccion = $this->sanitizeUtf8($direccion);

        $ciudades = [
            'Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura', 'Chiclayo',
            'Iquitos', 'Huancayo', 'Tacna', 'Puno',
        ];

        foreach ($ciudades as $ciudad) {
            if (stripos($direccion, $ciudad) !== false) {
                return $ciudad;
            }
        }

        return 'Lima';
    }
}
