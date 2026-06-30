<?php

namespace App\Console\Commands;

use App\Services\NotificacionService;
use Illuminate\Console\Command;

class StartNotificationCycle extends Command
{
    protected $signature = 'notifications:start';

    protected $description = 'Ejecuta el ciclo de notificaciones manualmente (alertas + seguimientos)';

    public function handle(NotificacionService $notificacionService): void
    {
        $notificacionService->ejecutarCicloCompleto();

        $this->info('Ciclo de notificaciones ejecutado exitosamente.');
    }
}
