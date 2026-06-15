<?php

namespace App\Enums;

enum ActivityModule: string
{
    case Auth = 'auth';
    case Clients = 'clients';
    case Plans = 'plans';
    case Subscriptions = 'subscriptions';
    case System = 'system';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
