DROP TABLE IF EXISTS users;
CREATE TABLE users(
          id INTEGER PRIMARY KEY,
          username TEXT,
          password TEXT,
          city TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER authentication_exercise BEFORE UPDATE ON users BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
END;
