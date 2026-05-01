<?php
/**
 * Database Configuration for GURUKUL IAS MI Assessment
 */

session_start();

$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'gurukul_mi';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: 'root';
$charset = 'utf8mb4';

$root = str_replace('\\', '/', dirname($_SERVER['PHP_SELF']));
$root = ($root === '/') ? '' : rtrim($root, '/');
define('BASE_URL', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]" . $root);

function getPDO() {
    global $host, $db, $user, $pass, $charset;
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
         return new PDO($dsn, $user, $pass, $options);
    } catch (\PDOException $e) {
         header('Content-Type: application/json');
         die(json_encode(['error' => 'Database connection failed']));
    }
}

function checkAdmin() {
    if (!isset($_SESSION['admin_id'])) {
        header('Content-Type: application/json');
        die(json_encode(['error' => 'Admin unauthorized']));
    }
}

function checkStudent() {
    if (!isset($_SESSION['student_id'])) {
        header('Content-Type: application/json');
        die(json_encode(['error' => 'Student unauthorized']));
    }
}
?>