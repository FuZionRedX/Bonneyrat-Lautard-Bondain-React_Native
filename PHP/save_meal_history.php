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

if ($email === "" || $mealIds === null) {
    echo json_encode(["success" => false, "error" => "missing_fields"]);
    exit;
}

$mealIdsJson = json_encode($mealIds);

if ($savedAt !== "") {
    $stmt = $conn->prepare(
        "INSERT INTO meal_history (user_email, meal_ids, saved_at) VALUES (?, ?, ?)"
    );
    $stmt->bind_param("sss", $email, $mealIdsJson, $savedAt);
} else {
    $stmt = $conn->prepare(
        "INSERT INTO meal_history (user_email, meal_ids) VALUES (?, ?)"
    );
    $stmt->bind_param("ss", $email, $mealIdsJson);
}
$ok = $stmt->execute();

echo json_encode(["success" => $ok]);
?>
