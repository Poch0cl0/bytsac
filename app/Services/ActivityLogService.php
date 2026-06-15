<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class ActivityLogService
{
    private const SENSITIVE_FIELDS = [
        'password',
        'remember_token',
    ];

    public function log(
        string $action,
        string $module,
        string $description,
        ?Model $subject = null,
        ?array $old = null,
        ?array $new = null,
        ?int $tenantId = null,
        ?int $userId = null,
        ?string $userName = null,
    ): ActivityLog {
        $user = auth()->user();

        return ActivityLog::create([
            'tenant_id' => $tenantId ?? $user?->tenant_id ?? $subject?->getAttribute('tenant_id'),
            'user_id' => $userId ?? $user?->id,
            'user_name' => $userName ?? $user?->name ?? ($userId === null && $user === null ? 'Sistema' : null),
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'subject_type' => $subject ? $subject->getMorphClass() : null,
            'subject_id' => $subject?->getKey(),
            'old_values' => $this->filterSensitive($old),
            'new_values' => $this->filterSensitive($new),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    public function logFromRequest(
        Request $request,
        string $action,
        string $module,
        string $description,
        ?Model $subject = null,
        ?array $old = null,
        ?array $new = null,
    ): ActivityLog {
        return ActivityLog::create([
            'tenant_id' => $subject?->getAttribute('tenant_id') ?? auth()->user()?->tenant_id,
            'user_id' => auth()->id(),
            'user_name' => auth()->user()?->name,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'subject_type' => $subject ? $subject->getMorphClass() : null,
            'subject_id' => $subject?->getKey(),
            'old_values' => $this->filterSensitive($old),
            'new_values' => $this->filterSensitive($new),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);
    }

    public function logModelEvent(
        Model $model,
        string $action,
        string $module,
        string $description,
        ?array $old = null,
        ?array $new = null,
    ): ActivityLog {
        return $this->log(
            action: $action,
            module: $module,
            description: $description,
            subject: $model,
            old: $old,
            new: $new,
        );
    }

    public function logAsSystem(
        string $action,
        string $module,
        string $description,
        ?Model $subject = null,
        ?array $old = null,
        ?array $new = null,
    ): ActivityLog {
        return $this->log(
            action: $action,
            module: $module,
            description: $description,
            subject: $subject,
            old: $old,
            new: $new,
            tenantId: $subject?->getAttribute('tenant_id'),
            userId: null,
            userName: 'Sistema',
        );
    }

    public function filterSensitive(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        return Arr::except($values, self::SENSITIVE_FIELDS);
    }
}
