<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require "config.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data["email"] ?? "");

require_user($conn, $email, $data["password"] ?? "");

$stmt = $conn->prepare("DELETE FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$ok = $stmt->execute();

echo json_encode([
    "success" => $ok && $stmt->affected_rows > 0
]);
?>
