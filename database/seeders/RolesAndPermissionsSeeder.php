<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()['cache']->forget('spatie.permission.cache');

        $adminRole = Role::firstOrCreate(['name' => 'administrador']);
        $commercialRole = Role::firstOrCreate(['name' => 'comercial']);
        $clientRole = Role::firstOrCreate(['name' => 'cliente']);

        $permissions = [
            'view clients',
            'create clients',
            'edit clients',
            'delete clients',
            'view plans',
            'create plans',
            'edit plans',
            'delete plans',
            'view subscriptions',
            'create subscriptions',
            'edit subscriptions',
            'delete subscriptions',
            'renew subscriptions',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole->syncPermissions($permissions);
        $commercialRole->syncPermissions([
            'view clients',
            'create clients',
            'edit clients',
            'view plans',
            'view subscriptions',
            'create subscriptions',
            'edit subscriptions',
            'renew subscriptions',
        ]);
        $clientRole->syncPermissions([
            'view plans',
            'view subscriptions',
        ]);

        // Usuario Administrador
        $admin = User::firstOrCreate(
            ['email' => 'admin@bytsac.pe'],
            [
                'name' => 'Administrador BYTSAC',
                'password' => bcrypt('Admin@2026!'),
                'tenant_id' => 1,
            ]
        );
        $admin->syncRoles([$adminRole]);

        // Usuario Comercial
        $commercial = User::firstOrCreate(
            ['email' => 'comercial@bytsac.pe'],
            [
                'name' => 'Usuario Comercial',
                'password' => bcrypt('Comercial@2026!'),
                'tenant_id' => 1,
            ]
        );
        $commercial->syncRoles([$commercialRole]);

        // Usuario Cliente
        $client = User::firstOrCreate(
            ['email' => 'cliente@bytsac.pe'],
            [
                'name' => 'Usuario Cliente',
                'password' => bcrypt('Cliente@2026!'),
                'tenant_id' => 1,
            ]
        );
        $client->syncRoles([$clientRole]);
    }
}