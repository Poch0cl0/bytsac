<?php

namespace App\Providers;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Observers\AuditableObserver;
use App\Policies\ActivityLogPolicy;
use App\Policies\ClientPolicy;
use App\Policies\PlanPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(ActivityLog::class, ActivityLogPolicy::class);
        Gate::policy(Client::class, ClientPolicy::class);
        Gate::policy(Plan::class, PlanPolicy::class);

        Client::observe(AuditableObserver::class);
        Plan::observe(AuditableObserver::class);
        Subscription::observe(AuditableObserver::class);

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
