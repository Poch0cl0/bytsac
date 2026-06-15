<?php

namespace App\Enums;

enum ActivityAction: string
{
    case Login = 'login';
    case LoginFailed = 'login_failed';
    case Logout = 'logout';
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';
    case Renewed = 'renewed';
    case Cancelled = 'cancelled';
    case ToggleAutoRenew = 'toggle_auto_renew';
    case SystemUpdate = 'status_updated';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
