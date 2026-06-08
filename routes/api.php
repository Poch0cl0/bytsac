<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\PlanController;

// --------------------------------------------------------
// Rutas Públicas (Autenticación)
// --------------------------------------------------------
Route::post('/login', [AuthController::class, 'login']);

// --------------------------------------------------------
// Rutas Protegidas
// --------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    
    // Perfil y Logout
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ==========================================
    // MÓDULO: CLIENTES
    // ==========================================
    Route::get('/clients', [ClientController::class, 'index'])->middleware('can:view clients');
    Route::post('/clients', [ClientController::class, 'store'])->middleware('can:create clients');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->middleware('can:edit clients');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->middleware('can:delete clients');

    // ==========================================
    // MÓDULO: PLANES (Catálogo)
    // ==========================================
    Route::get('/plans', [PlanController::class, 'index'])->middleware('can:view plans');
    Route::post('/plans', [PlanController::class, 'store'])->middleware('can:create plans');
    Route::put('/plans/{plan}', [PlanController::class, 'update'])->middleware('can:edit plans');
    Route::delete('/plans/{plan}', [PlanController::class, 'destroy'])->middleware('can:delete plans');

    // ==========================================
    // MÓDULO: SUSCRIPCIONES
    // ==========================================
    Route::get('/subscriptions', [SubscriptionController::class, 'index'])->middleware('can:view subscriptions');
    Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show'])->middleware('can:view subscriptions');
    
    // Creación y Modificación (Comercial y Admin)
    Route::post('/subscriptions', [SubscriptionController::class, 'store'])->middleware('can:create subscriptions');
    Route::patch('/subscriptions/{subscription}/toggle-auto-renew', [SubscriptionController::class, 'toggleAutoRenew'])->middleware('can:edit subscriptions');
    Route::post('/subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel'])->middleware('can:edit subscriptions');
    Route::post('/subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew'])->middleware('can:renew subscriptions');
    
    // Eliminación (Solo Admin)
    Route::delete('/subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->middleware('can:delete subscriptions');

});