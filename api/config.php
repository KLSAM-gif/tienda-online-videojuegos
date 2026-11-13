<?php
declare(strict_types=1);

// Obtener configuraciones desde variables de entorno.
function configEnv(string $name, string $default): string {
    $value = getenv($name);
    return $value === false ? $default : $value;
}

// Conexión a la base de datos.
function db(): PDO {
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = configEnv('DB_HOST', '127.0.0.1');
    $port = configEnv('DB_PORT', '3306');
    $name = configEnv('DB_NAME', 'gamingstore');
    $user = configEnv('DB_USER', 'root');
    $pass = configEnv('DB_PASSWORD', '');

    $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
