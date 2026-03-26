-- Run this in your health_app database (XAMPP phpMyAdmin or MySQL CLI)

CREATE TABLE IF NOT EXISTS meal_history (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_email   VARCHAR(255) NOT NULL,
    meal_ids     JSON         NOT NULL,
    -- meal_ids shape: {"breakfast":[1],"lunch":[5,8],"dinner":[12],"snack":[20]}
    saved_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_meal_history_user
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,

    INDEX idx_mh_user  (user_email),
    INDEX idx_mh_saved (saved_at)
);
