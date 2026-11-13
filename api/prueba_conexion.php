<?php
require_once __DIR__ . '/config.php';

try {
    $conexion = db();

    echo "¡Conexión exitosa con GamingStore!";

} catch (PDOException $e) {
    echo "Error de conexión: " . $e->getMessage();
}