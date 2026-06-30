<?php

namespace App\Jobs;

use App\Services\NotificacionService;
use Illuminate\Support\Facades\Log;

class CicloNotificaciones
{
    public function handle(): void
    {
        try {
            app(NotificacionService::class)->ejecutarCicloCompleto();

            Log::info('CicloNotificaciones: ciclo completado exitosamente.');
        } catch (\Exception $e) {
            Log::error('CicloNotificaciones: error - ' . $e->getMessage());
        }
    }
}
