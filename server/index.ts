import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import ip from "ip";
import bcrypt from "bcryptjs";

const _ip = ip.address(); // Get the local IP address

console.log(`Server will be accessible at http://${_ip}:3001`);

import createHabitsRouter from "./routes/habits";
import createUsersRouter from "./routes/users";
import createHabitCompletionsRouter from "./routes/habitCompletions";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// SQLite DB setup
const db = new sqlite3.Database(path.join(__dirname, "habits.db"));

db.serialize(() => {
  // Tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    age INTEGER,
    timezone TEXT,
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    frequency TEXT NOT NULL,
    tags TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS habit_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id),
    UNIQUE(habit_id, date)
  )`);

  // Mock user
  const hashedPassword = bcrypt.hashSync("password123", 10); // Example hashed password
  db.run(
    `
    INSERT OR IGNORE INTO users (id, username, email, password, age, timezone, display_name)
    VALUES (1, 'testuser', 'test@example.com', ?, 25, 'UTC', 'Test User')
  `,
    [hashedPassword]
  );

  // Habits
  db.run(`
    INSERT OR IGNORE INTO habits (id, user_id, title, frequency, tags)
    VALUES 
      (1, 1, 'Morning Workout', 'daily', '["health", "fitness"]'),
      (2, 1, 'Read Book', 'daily', '["learning", "personal"]')
  `);

  // Completions over 3 weeks
  const completions = [
    // Week 1
    [1, "2025-05-19", false],
    [2, "2025-05-19", true], // Monday
    [1, "2025-05-20", true],
    [2, "2025-05-20", false], // Tuesday
    [1, "2025-05-21", true],
    [2, "2025-05-21", false], // Wednesday
    [1, "2025-05-22", true],
    [2, "2025-05-22", false], // Thursday ❌
    [1, "2025-05-23", false],
    [2, "2025-05-23", true], // Friday
    [1, "2025-05-24", true],
    [2, "2025-05-24", true], // Saturday
    [1, "2025-05-25", true],
    [2, "2025-05-25", true], // Sunday

    // Week 2
    [1, "2025-05-26", false],
    [2, "2025-05-26", true], // Monday
    [1, "2025-05-27", true],
    [2, "2025-05-27", false], // Tuesday
    [1, "2025-05-28", false],
    [2, "2025-05-28", false], // Wednesday
    [1, "2025-05-29", true],
    [2, "2025-05-29", false], // Thursday ❌
    [1, "2025-05-30", false],
    [2, "2025-05-30", true], // Friday
    [1, "2025-05-31", true],
    [2, "2025-05-31", true], // Saturday
    [1, "2025-06-01", true],
    [2, "2025-06-01", true], // Sunday

    // Week 3
    [1, "2025-06-02", false],
    [2, "2025-06-02", false], // Monday
    [1, "2025-06-03", true],
    [2, "2025-06-03", true], // Tuesday
    [1, "2025-06-04", true],
    [2, "2025-06-04", false], // Wednesday
    [1, "2025-06-05", true],
    [2, "2025-06-05", false], // Thursday ❌
    [1, "2025-06-06", false],
    [2, "2025-06-06", true], // Friday
    [1, "2025-06-07", true],
    [2, "2025-06-07", true], // Saturday
    [1, "2025-06-08", true],
    [2, "2025-06-08", true], // Sunday
  ];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO habit_completions (habit_id, date, completed)
    VALUES (?, ?, ?)
  `);

  completions.forEach(([habit_id, date, completed]) => {
    insertStmt.run(habit_id, date, completed);
  });

  insertStmt.finalize();
});

// Mount routers
app.use("/habits", createHabitsRouter(db));
app.use("/completions", createHabitCompletionsRouter(db));
app.use("/", createUsersRouter(db));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
