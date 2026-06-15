<?php

namespace App\Observers;

use App\Enums\ActivityAction;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Model;

class AuditableObserver
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function created(Model $model): void
    {
        if (! $this->shouldAudit($model)) {
            return;
        }

        $this->activityLogService->logModelEvent(
            model: $model,
            action: ActivityAction::Created->value,
            module: $model->getAuditModule(),
            description: $model->getAuditDescription(ActivityAction::Created->value),
            old: null,
            new: $this->extractAttributes($model, $model->getAttributes()),
        );
    }

    public function updated(Model $model): void
    {
        if (! $this->shouldAudit($model)) {
            return;
        }

        $changes = $model->getChanges();
        $excluded = $model->getAuditExcludedFields();

        $newValues = array_diff_key($changes, array_flip($excluded));
        if ($newValues === []) {
            return;
        }

        $oldValues = [];
        foreach (array_keys($newValues) as $key) {
            $oldValues[$key] = $model->getOriginal($key);
        }

        $this->activityLogService->logModelEvent(
            model: $model,
            action: ActivityAction::Updated->value,
            module: $model->getAuditModule(),
            description: $model->getAuditDescription(ActivityAction::Updated->value),
            old: $oldValues,
            new: $newValues,
        );
    }

    public function deleted(Model $model): void
    {
        if (! $this->shouldAudit($model)) {
            return;
        }

        $this->activityLogService->logModelEvent(
            model: $model,
            action: ActivityAction::Deleted->value,
            module: $model->getAuditModule(),
            description: $model->getAuditDescription(ActivityAction::Deleted->value),
            old: $this->extractAttributes($model, $model->getAttributes()),
            new: null,
        );
    }

    private function shouldAudit(Model $model): bool
    {
        return method_exists($model, 'isAuditingEnabled')
            && $model->isAuditingEnabled()
            && method_exists($model, 'getAuditModule');
    }

    private function extractAttributes(Model $model, array $attributes): array
    {
        return array_diff_key(
            $attributes,
            array_flip($model->getAuditExcludedFields()),
        );
    }
}
