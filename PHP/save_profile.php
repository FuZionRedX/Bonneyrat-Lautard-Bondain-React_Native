<?php
require "auth.php";

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
// NULL = not chosen yet: the app keeps the device language.
$language = in_array($data["language"] ?? null, ["en", "fr", "es", "de"], true) ? $data["language"] : null;

if ($email === "" || $plainPassword === "") {
    echo json_encode(["success" => false, "error" => "missing_fields"]);
    exit;
}

$existingHash = get_password_hash($conn, $email);

if ($existingHash === null) {
    // New account. A plain INSERT (no upsert) fails on the unique email key if another sign-up wins the race.
    $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare(
        "INSERT INTO users (email, password, full_name, age, gender, height, weight, goal, dark_mode, language)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("sssissssis", $email, $hashedPassword, $fullName, $age, $gender, $height, $weight, $goal, $darkmode, $language);
} else {
    // Existing account: only its owner may update it.
    if (!password_verify($plainPassword, $existingHash)) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "email_taken"]);
        exit;
    }
    $stmt = $conn->prepare(
        "UPDATE users
         SET full_name = ?, age = ?, gender = ?, height = ?, weight = ?, goal = ?, dark_mode = ?, language = ?
         WHERE email = ?"
    );
    $stmt->bind_param("sissssiss", $fullName, $age, $gender, $height, $weight, $goal, $darkmode, $language, $email);
}

$ok = $stmt->execute();
echo json_encode(["success" => $ok]);
