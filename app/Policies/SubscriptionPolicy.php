<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;

class SubscriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view subscriptions');
    }

    public function view(User $user, Subscription $subscription): bool
    {
        return $user->can('view subscriptions') && $user->tenant_id === $subscription->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->can('create subscriptions');
    }

    public function update(User $user, Subscription $subscription): bool
    {
        return $user->can('edit subscriptions') && $user->tenant_id === $subscription->tenant_id;
    }

    public function delete(User $user, Subscription $subscription): bool
    {
        return $user->can('delete subscriptions') && $user->tenant_id === $subscription->tenant_id;
    }

    public function renew(User $user, Subscription $subscription): bool
    {
        return $user->can('renew subscriptions') && $user->tenant_id === $subscription->tenant_id;
    }
}
