<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view activity logs');
    }

    public function view(User $user, ActivityLog $activityLog): bool
    {
        return $user->can('view activity logs')
            && $activityLog->tenant_id === $user->tenant_id;
    }
}
