<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->date('ultima_alerta_enviada')->nullable()->after('renovacion_automatica');
            $table->date('seguimiento_7_enviado')->nullable()->after('ultima_alerta_enviada');
            $table->date('seguimiento_30_enviado')->nullable()->after('seguimiento_7_enviado');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['ultima_alerta_enviada', 'seguimiento_7_enviado', 'seguimiento_30_enviado']);
        });
    }
};
