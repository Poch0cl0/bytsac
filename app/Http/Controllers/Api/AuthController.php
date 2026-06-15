<?php

namespace App\Http\Controllers\Api;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            $this->activityLogService->log(
                action: ActivityAction::LoginFailed->value,
                module: ActivityModule::Auth->value,
                description: "Intento fallido de inicio de sesión: {$credentials['email']}",
            );

            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user()->load('roles');
        $token = $user->createToken('api-token')->plainTextToken;

        $this->activityLogService->logFromRequest(
            request: $request,
            action: ActivityAction::Login->value,
            module: ActivityModule::Auth->value,
            description: 'Inicio de sesión exitoso',
            subject: $user,
        );

        return response()->json([
            'token' => $token,
            'user' => $user,
            'roles' => $user->getRoleNames(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->activityLogService->logFromRequest(
            request: $request,
            action: ActivityAction::Logout->value,
            module: ActivityModule::Auth->value,
            description: 'Cierre de sesión',
            subject: $user,
        );

        $user->currentAccessToken()?->delete();

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles', 'permissions');

        return response()->json([
            'user' => $user,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }
}
