<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ImportFromJson extends Command
{
    protected $signature = 'db:import-from-json';
    protected $description = 'Import data from exported_data.json into MySQL';

    public function handle()
    {
        $file = database_path('exported_data.json');
        if (!file_exists($file)) {
            $this->error('File not found: ' . $file);
            return 1;
        }

        $data = json_decode(file_get_contents($file), true);
        $imported = 0;
        $skipped = 0;

        // Define order to respect foreign keys
        $tableOrder = [
            'roles', 'permissions', 'users', 'plans',
            'model_has_roles', 'model_has_permissions', 'role_has_permissions',
            'clients', 'subscriptions', 'notifications', 'activity_logs',
            'personal_access_tokens', 'sessions', 'cache'
        ];

        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ($tableOrder as $table) {
            if (!isset($data[$table]) || empty($data[$table]['rows'])) {
                continue;
            }

            if (!Schema::hasTable($table)) {
                $this->warn("Table '$table' does not exist, skipping");
                continue;
            }

            $columns = $data[$table]['columns'];
            $rows = $data[$table]['rows'];
            $count = 0;

            foreach ($rows as $row) {
                $record = array_combine($columns, $row);
                try {
                    DB::table($table)->insert($record);
                    $count++;
                } catch (\Exception $e) {
                    $this->warn("  Skipped row in $table: " . $e->getMessage());
                    $skipped++;
                }
            }

            if ($count > 0) {
                $this->info("  Imported $count rows into $table");
                $imported += $count;
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info("\nDone! Imported $imported rows, skipped $skipped.");
        return 0;
    }
}
