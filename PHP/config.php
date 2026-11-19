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

// Errors must never reach the client as an HTML page (XAMPP has display_errors=On):
// that breaks the JSON the app reads and shows server paths. They still go to the PHP error log.
ini_set("display_errors", "0");
set_exception_handler(function (Throwable $e) {
    error_log((string)$e);
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "server_error"]);
});

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
