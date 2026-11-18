<?php
// Account checks shared by the endpoints that read or change a user's data.
require_once __DIR__ . "/config.php";

// Returns the stored password hash for $email, or null when no such user exists.
function get_password_hash(mysqli $conn, string $email): ?string {
    $stmt = $conn->prepare("SELECT password FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    return $row ? $row["password"] : null;
}

// Stops the request with 401 unless $email/$password match an existing account.
function require_user(mysqli $conn, string $email, string $password): void {
    $hash = $email === "" ? null : get_password_hash($conn, $email);
    if ($hash === null || !password_verify($password, $hash)) {
        http_response_code(401);
        die(json_encode(["success" => false, "error" => "unauthorized"]));
    }
}
