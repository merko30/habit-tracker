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
      (2, 1, 'Read Book', 'daily', '["learning", "personal"]'),
      (3, 1, 'Weekly Planning', 'weekly', '["organization", "focus"]'),
      (4, 1, 'Monthly Reflection', 'monthly', '["mindfulness", "growth"]')
  `);

  // Completions for daily habits (up to today)
  const today = new Date();
  const startDate = new Date("2025-05-19");
  const completions = [];
  let d = new Date(startDate);
  let toggle = false;
  while (d <= today) {
    const dateStr = d.toISOString().slice(0, 10);
    completions.push([1, dateStr, toggle]);
    completions.push([2, dateStr, !toggle]);
    d.setDate(d.getDate() + 1);
    toggle = !toggle;
  }

  // Weekly completions (simulate 4 weeks)
  function getWeekStr(date: Date) {
    const year = date.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const weekNumber = Math.ceil(
      ((date.getTime() - jan1.getTime()) / 86400000 + 1) / 7
    );
    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
  }
  let weekStart = new Date("2025-05-19");
  for (let i = 0; i < 4; i++) {
    const weekStr = getWeekStr(weekStart);
    completions.push([3, weekStr, i % 2 === 0]); // alternate completed
    weekStart.setDate(weekStart.getDate() + 7);
  }

  // Monthly completions (simulate 3 months)
  let monthStart = new Date("2025-04-01");
  for (let i = 0; i < 3; i++) {
    const monthStr = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    completions.push([4, monthStr, i % 2 === 1]); // alternate completed
    monthStart.setMonth(monthStart.getMonth() + 1);
  }

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
