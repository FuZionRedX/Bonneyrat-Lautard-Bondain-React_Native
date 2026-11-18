<?php
require "auth.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data["email"] ?? "");
$newPassword = $data["new_password"] ?? "";

require_user($conn, $email, $data["password"] ?? "");

if ($newPassword === "") {
    echo json_encode(["success" => false, "error" => "missing_fields"]);
    exit;
}

$hash = password_hash($newPassword, PASSWORD_DEFAULT);
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
$stmt->bind_param("ss", $hash, $email);
$ok = $stmt->execute();

echo json_encode(["success" => $ok]);
