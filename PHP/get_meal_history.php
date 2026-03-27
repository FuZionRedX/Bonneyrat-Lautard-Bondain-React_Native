<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require "config.php";

$email = trim($_GET["email"] ?? "");

if ($email === "") {
    echo json_encode(["error" => "missing_email"]);
    exit;
}

// Fetch entries from the last 7 days + any future planned entries
$stmt = $conn->prepare(
    "SELECT meal_ids, saved_at
     FROM meal_history
     WHERE user_email = ?
       AND saved_at >= NOW() - INTERVAL 7 DAY
     ORDER BY saved_at DESC"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = [
        "meal_ids" => json_decode($row["meal_ids"], true),
        "saved_at" => $row["saved_at"],
    ];
}

echo json_encode($rows);
?>
