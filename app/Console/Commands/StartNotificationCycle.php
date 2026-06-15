<?php

namespace App\Console\Commands;

use App\Jobs\CicloNotificaciones;
use Illuminate\Console\Command;

class StartNotificationCycle extends Command
{
    protected $signature = 'notifications:start';

    protected $description = 'Inicia el ciclo auto-gestionado de notificaciones (alertas + seguimientos)';

    public function handle(): void
    {
        CicloNotificaciones::dispatch();

        $this->info('Ciclo de notificaciones iniciado.');
        $this->info('Se ejecutará cada 24h a las 06:00 automáticamente.');
        $this->info('Mantén activo el queue worker: php artisan queue:work');
    }
}
