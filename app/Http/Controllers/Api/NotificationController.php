<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificacionService $notificacionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tipo' => ['nullable', Rule::in(['aviso_comercial', 'seguimiento'])],
            'estado' => ['nullable', Rule::in(['leidas', 'no_leidas'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = $request->user()
            ->notifications()
            ->latest();

        if (! empty($validated['tipo'])) {
            $query->where('data->tipo', $validated['tipo']);
        }

        if (! empty($validated['estado'])) {
            $validated['estado'] === 'no_leidas'
                ? $query->whereNull('read_at')
                : $query->whereNotNull('read_at');
        }

        $notifications = $query->paginate(20);

        return response()->json($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $this->notificacionService->ejecutarCicloCompleto();

        $count = $request->user()
            ->unreadNotifications()
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = DatabaseNotification::where('id', $id)
            ->where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', get_class($request->user()))
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['message' => 'Notificación marcada como leída.']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()
            ->unreadNotifications
            ->markAsRead();

        return response()->json(['message' => 'Todas las notificaciones fueron marcadas como leídas.']);
    }

    public function getPreferences(Request $request): JsonResponse
    {
        $preferences = $request->user()->notification_preferences ?? [];

        return response()->json([
            'aviso_comercial' => $preferences['aviso_comercial'] ?? true,
            'seguimiento' => $preferences['seguimiento'] ?? true,
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'aviso_comercial' => ['sometimes', 'boolean'],
            'seguimiento' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        $preferences = array_merge($user->notification_preferences ?? [], $validated);
        $user->notification_preferences = $preferences;
        $user->save();

        return response()->json([
            'message' => 'Preferencias actualizadas correctamente.',
            'preferences' => [
                'aviso_comercial' => $preferences['aviso_comercial'] ?? true,
                'seguimiento' => $preferences['seguimiento'] ?? true,
            ],
        ]);
    }
}
