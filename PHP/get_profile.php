<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require "config.php";

/*
  POST: login (email + password), verifies with password_verify
  GET : profile fetch by email (no password check)
*/

if ($_SERVER["REQUEST_METHOD"] === "POST") {
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

    $storedPassword = $row["password"] ?? "";

    $isValid = password_verify($password, $storedPassword);

    // Optional migration path for old plaintext rows:
    if (!$isValid && hash_equals($storedPassword, $password)) {
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $u = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
        $u->bind_param("ss", $newHash, $email);
        $u->execute();
        $isValid = true;
    }

    if (!$isValid) {
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
    exit;
}

// GET fallback (by email only)
$email = trim($_GET["email"] ?? "");
if ($email === "") {
    echo json_encode(["error" => "No email provided"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT email, full_name, age, gender, height, weight, goal, dark_mode
    FROM users
    WHERE email = ?
    LIMIT 1
");
$stmt->bind_param("s", $email);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row) {
    echo json_encode(["error" => "Not found"]);
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
?>