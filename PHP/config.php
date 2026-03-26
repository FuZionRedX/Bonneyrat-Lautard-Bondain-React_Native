<?php
header("Content-Type: application/json");

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
?>