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
$plainPassword = $data["password"] ?? "";
$fullName = trim($data["fullName"] ?? "");
$age = (int)($data["age"] ?? 0);
$gender = trim($data["gender"] ?? "");
$height = trim((string)($data["height"] ?? ""));
$weight = trim((string)($data["weight"] ?? ""));
$goal = trim($data["goal"] ?? "");
$darkmode = !empty($data["darkMode"]) ? 1 : 0;

if ($email === "" || $plainPassword === "") {
    echo json_encode(["success" => false, "error" => "missing_fields"]);
    exit;
}

$hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
    "INSERT INTO users (email, password, full_name, age, gender, height, weight, goal, dark_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password=VALUES(password),
       full_name=VALUES(full_name),
       age=VALUES(age),
       gender=VALUES(gender),
       height=VALUES(height),
       weight=VALUES(weight),
        goal=VALUES(goal),
       dark_mode=VALUES(dark_mode)
);

$stmt->bind_param(
        "sssissssi",
    $email,
    $hashedPassword,
    $fullName,
    $age,
    $gender,
    $height,
    $weight,
    $goal,
    $darkmode
);

$ok = $stmt->execute();
echo json_encode(["success" => $ok]);
?>