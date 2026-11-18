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

$email    = trim($data["email"]    ?? "");
$mealIds  = $data["meal_ids"] ?? null;
$savedAt  = trim($data["saved_at"] ?? "");

require_user($conn, $email, $data["password"] ?? "");

if (!is_array($mealIds) || ($savedAt !== "" && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $savedAt))) {
    echo json_encode(["success" => false, "error" => "invalid_fields"]);
    exit;
}

$mealIdsJson = json_encode($mealIds);
$savedAt = $savedAt === "" ? null : $savedAt; // NULL -> NOW() below

// One plan per user per day: replace that day's row instead of adding another.
$conn->begin_transaction();

$del = $conn->prepare(
    "DELETE FROM meal_history WHERE user_email = ? AND DATE(saved_at) = DATE(COALESCE(?, NOW()))"
);
$del->bind_param("ss", $email, $savedAt);
$del->execute();

$stmt = $conn->prepare(
    "INSERT INTO meal_history (user_email, meal_ids, saved_at) VALUES (?, ?, COALESCE(?, NOW()))"
);
$stmt->bind_param("sss", $email, $mealIdsJson, $savedAt);
$ok = $stmt->execute();

$conn->commit();

echo json_encode(["success" => $ok]);
?>
