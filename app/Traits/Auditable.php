<?php

namespace App\Traits;

trait Auditable
{
    protected bool $auditingEnabled = true;

    public function disableAuditing(): static
    {
        $this->auditingEnabled = false;

        return $this;
    }

    public function enableAuditing(): static
    {
        $this->auditingEnabled = true;

        return $this;
    }

    public function isAuditingEnabled(): bool
    {
        return $this->auditingEnabled;
    }

    public function getAuditModule(): string
    {
        return class_basename($this);
    }

    public function getAuditExcludedFields(): array
    {
        return ['created_at', 'updated_at'];
    }

    public function getAuditDescription(string $action): string
    {
        $label = class_basename($this).' #'.$this->getKey();

        return match ($action) {
            'created' => "{$label} creado",
            'updated' => "{$label} actualizado",
            'deleted' => "{$label} eliminado",
            default => "{$label}: {$action}",
        };
    }
}
