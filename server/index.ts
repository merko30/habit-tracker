import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import ip from "ip";

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
    tags TEXT NOT NULL, -- JSON stringified array
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
});

// Mount routers
app.use("/habits", createHabitsRouter(db));
app.use("/completions", createHabitCompletionsRouter(db));
app.use("/", createUsersRouter(db));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
