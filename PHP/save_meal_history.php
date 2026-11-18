<?php
require "auth.php";

$data = json_decode(file_get_contents("php://input"), true);

$email    = trim($data["email"]    ?? "");
$mealIds  = $data["meal_ids"] ?? null;
$savedAt  = trim($data["saved_at"] ?? "");

require_user($conn, $email, $data["password"] ?? "");

$validDate = $savedAt === ""
    || (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $savedAt, $d) && checkdate((int)$d[2], (int)$d[3], (int)$d[1]));

if (!is_array($mealIds) || !$validDate) {
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

$ok = true;
// An empty plan (every category empty) only clears the day.
if (count(array_filter($mealIds)) > 0) {
    $stmt = $conn->prepare(
        "INSERT INTO meal_history (user_email, meal_ids, saved_at) VALUES (?, ?, COALESCE(?, NOW()))"
    );
    $stmt->bind_param("sss", $email, $mealIdsJson, $savedAt);
    $ok = $stmt->execute();
}

$conn->commit();

echo json_encode(["success" => $ok]);
