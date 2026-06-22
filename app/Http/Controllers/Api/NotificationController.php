<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificacionService $notificacionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->notificacionService->ejecutarCicloCompleto();

        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20);

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
}
