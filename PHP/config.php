<?php
// Shared setup for every endpoint: JSON + CORS headers, preflight, DB connection.
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

$host = "localhost";
$db   = "health_app";
$user = "root";
$pass = ""; // default XAMPP password is empty

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed"]));
}

$conn->set_charset("utf8mb4");
