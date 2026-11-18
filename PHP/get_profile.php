<?php
require "config.php";

// POST: login (email + password), verifies with password_verify
$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    echo json_encode(["error" => "missing_fields"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT email, password, full_name, age, gender, height, weight, goal, dark_mode
    FROM users
    WHERE email = ?
    LIMIT 1
");
$stmt->bind_param("s", $email);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row) {
    echo json_encode(["error" => "not_found"]);
    exit;
}

if (!password_verify($password, $row["password"] ?? "")) {
    echo json_encode(["error" => "wrong_password"]);
    exit;
}

echo json_encode([
    "email" => $row["email"],
    "fullName" => $row["full_name"],
    "age" => (string)$row["age"],
    "gender" => $row["gender"],
    "height" => (string)$row["height"],
    "weight" => (string)$row["weight"],
    "goal" => $row["goal"],
    "darkMode" => ((int)($row["dark_mode"] ?? 0)) === 1
]);
