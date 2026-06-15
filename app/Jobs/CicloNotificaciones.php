<?php

namespace App\Jobs;

use App\Services\NotificacionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CicloNotificaciones implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        try {
            app(NotificacionService::class)->ejecutarCicloCompleto();

            Log::info('CicloNotificaciones: ciclo completado exitosamente.');
        } catch (\Exception $e) {
            Log::error('CicloNotificaciones: error - ' . $e->getMessage());
        }

        $proximaEjecucion = now()->addDay()->startOfDay()->addHours(6);
        CicloNotificaciones::dispatch()->delay($proximaEjecucion);
    }
}
