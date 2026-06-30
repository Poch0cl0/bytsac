<?php

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $service = app(App\Services\RenewalPredictionService::class);
    echo 'Available: '.($service->isAvailable() ? 'yes' : 'no').PHP_EOL;
    $results = $service->predictForTenant(1);
    echo 'Count: '.count($results).PHP_EOL;
    echo json_encode($results[0] ?? [], JSON_PRETTY_PRINT).PHP_EOL;
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage().PHP_EOL;
    echo $e->getTraceAsString().PHP_EOL;
}
