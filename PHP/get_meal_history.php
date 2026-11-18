<?php
require "auth.php";

// POST so the password travels in the body, not in the URL / server logs.
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data["email"] ?? "");

require_user($conn, $email, $data["password"] ?? "");

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
