<?php
$port = getenv('PORT') ?: '8000';
$host = '0.0.0.0';
$cmd = sprintf('php -S %s:%s -t public', $host, $port);
echo "Starting server: $cmd\n";
passthru($cmd, $exitCode);
exit($exitCode);
