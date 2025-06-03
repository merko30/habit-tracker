import express, { Response, RequestHandler } from "express";
import sqlite3 from "sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

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

// Type interfaces for DB rows
interface Habit {
  id: number;
  title: string;
  frequency: string;
  tags: string; // JSON stringified array
  created_at: string;
  completed_today?: boolean; // Optional, used for UI indication
}

interface HabitCompletion {
  id: number;
  habit_id: number;
  date: string; // ISO date string yyyy-mm-dd
  completed: boolean;
}

type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  age: number;
  timezone: string;
  display_name: string;
  created_at: string;
};

// Helper: Validate ID param
function validateId(idParam: string, res: Response): number | null {
  const id = Number(idParam);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return null;
  }
  return id;
}

// CRUD for habits

const getHabits: RequestHandler = (_req, res): void => {
  db.all<Habit>(`SELECT * FROM habits`, [], (err, habits) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // For each habit, calculate streak and completed_today
    const getStreakAndToday = (
      habitId: number,
      cb: (streak: number, completedToday: boolean) => void
    ) => {
      db.all<{ date: string }>(
        `SELECT date FROM habit_completions WHERE habit_id = ? AND completed = 1 ORDER BY date DESC`,
        [habitId],
        (err, rows) => {
          if (err) return cb(0, false);
          let streak = 0;
          let current: Date | null = null;
          let completedToday = false;
          const todayStr = new Date().toISOString().slice(0, 10);
          for (const row of rows) {
            const rowDate = new Date(row.date);
            if (row.date === todayStr) completedToday = true;
            if (streak === 0) current = rowDate;
            if (
              current &&
              rowDate.toISOString().slice(0, 10) ===
                current.toISOString().slice(0, 10)
            ) {
              streak++;
              current.setDate(current.getDate() - 1);
            } else {
              break;
            }
          }
          cb(streak, completedToday);
        }
      );
    };
    let count = habits.length;
    if (count === 0) return res.json([]);
    const result: any[] = [];
    habits.forEach((habit) => {
      getStreakAndToday(habit.id, (streak, completedToday) => {
        result.push({
          ...habit,
          tags: JSON.parse(habit.tags || "[]"),
          streak_count: streak,
          completed_today: completedToday,
        });
        count--;
        if (count === 0) {
          res.json(result);
        }
      });
    });
  });
};

const getHabitById: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;
  db.get<Habit>("SELECT * FROM habits WHERE id = ?", [id], (err, habit) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    // Calculate streak for this habit
    db.all<{ date: string }>(
      `SELECT date FROM habit_completions WHERE habit_id = ? AND completed = 1 ORDER BY date DESC`,
      [habit.id],
      (err, rows) => {
        let streak = 0;
        let current: Date | null = null;
        for (const row of rows) {
          const rowDate = new Date(row.date);
          if (streak === 0) current = rowDate;
          if (
            current &&
            rowDate.toISOString().slice(0, 10) ===
              current.toISOString().slice(0, 10)
          ) {
            streak++;
            current.setDate(current.getDate() - 1);
          } else {
            break;
          }
        }
        res.json({
          ...habit,
          tags: JSON.parse(habit.tags || "[]"),
          streak_count: streak,
        });
      }
    );
  });
};

const createHabit: RequestHandler = (req, res): void => {
  const { user_id, title, frequency, tags } = req.body as {
    user_id?: number;
    title?: string;
    frequency?: string;
    tags?: string[];
  };
  if (!user_id || !title || !frequency || !Array.isArray(tags)) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  db.run(
    "INSERT INTO habits (user_id, title, frequency, tags) VALUES (?, ?, ?, ?)",
    [user_id, title, frequency, JSON.stringify(tags)],
    function (this: sqlite3.RunResult, err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.get<Habit>(
        "SELECT * FROM habits WHERE id = ?",
        [this.lastID],
        (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          if (row) row.tags = JSON.parse(row.tags);
          res.status(201).json(row);
        }
      );
    }
  );
};

const updateHabit: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;

  const { title, frequency, tags } = req.body as {
    title?: string;
    frequency?: string;
    tags?: string[];
  };

  if (title === undefined || frequency === undefined || tags === undefined) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  db.run(
    "UPDATE habits SET title = ?, frequency = ?, tags = ? WHERE id = ?",
    [title, frequency, JSON.stringify(tags), id],
    function (this: sqlite3.RunResult, err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ updated: this.changes });
    }
  );
};

const deleteHabit: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;

  db.run(
    "DELETE FROM habits WHERE id = ?",
    [id],
    function (this: sqlite3.RunResult, err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ deleted: this.changes });
    }
  );
};

// CRUD for habit_completions

const getCompletions: RequestHandler = (_req, res): void => {
  db.all<HabitCompletion>(
    "SELECT * FROM habit_completions",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Convert completed from number to boolean
      const result = rows.map((row) => ({
        ...row,
        completed: Boolean(row.completed),
      }));
      res.json(result);
    }
  );
};

const getCompletionById: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;

  db.get<HabitCompletion>(
    "SELECT * FROM habit_completions WHERE id = ?",
    [id],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "Completion not found" });
        return;
      }
      res.json({ ...row, completed: Boolean(row.completed) });
    }
  );
};
const createOrUpdateCompletion: RequestHandler = (req, res): void => {
  const { habit_id, date, completed } = req.body as {
    habit_id?: number;
    date?: string;
    completed?: boolean;
  };

  if (!habit_id || !date || typeof completed !== "boolean") {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  db.serialize(() => {
    // Check if there was already a completion for today
    db.get<{ completed: number }>(
      `SELECT completed FROM habit_completions WHERE habit_id = ? AND date = ?`,
      [habit_id, date],
      (err, existing) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const alreadyCompleted = existing?.completed === 1;

        db.run(
          `
          INSERT INTO habit_completions (habit_id, date, completed)
          VALUES (?, ?, ?)
          ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
          `,
          [habit_id, date, completed ? 1 : 0],
          function (this: sqlite3.RunResult, err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            db.get<HabitCompletion>(
              `SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?`,
              [habit_id, date],
              (err, row) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }

                res.status(200).json({
                  ...row,
                  completed: Boolean(row.completed),
                });
              }
            );
          }
        );
      }
    );
  });
};

const deleteCompletion: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;

  db.run(
    "DELETE FROM habit_completions WHERE id = ?",
    [id],
    function (this: sqlite3.RunResult, err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ deleted: this.changes });
    }
  );
};

// Register (create user)
const registerUser: RequestHandler = async (req, res): Promise<void> => {
  const { username, email, password, age, timezone, display_name } =
    req.body as Partial<User>;
  if (!username || !email || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, email, password, age, timezone, display_name) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username,
        email,
        hashedPassword,
        age ?? null,
        timezone ?? null,
        display_name ?? null,
      ],
      function (this: sqlite3.RunResult, err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        db.get<User>(
          `SELECT id, username, email, age, timezone, display_name, created_at FROM users WHERE id = ?`,
          [this.lastID],
          (err, user) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.status(201).json(user);
          }
        );
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to hash password" });
  }
};

// Login (by email or username)
const loginUser: RequestHandler = (req, res): void => {
  const { email, username, password } = req.body as Partial<User>;
  if ((!email && !username) || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const query = email
    ? `SELECT * FROM users WHERE email = ?`
    : `SELECT * FROM users WHERE username = ?`;
  const value = email ? email : username;
  db.get<User>(query, [value], async (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const match = await bcrypt.compare(password!, user.password);
    if (!match) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    // Don't return password
    const { password: _pw, ...userData } = user;
    res.json(userData);
  });
};

// Get user by id
const getUserById: RequestHandler<{ id: string }> = (req, res) => {
  const id = validateId(req.params.id, res);
  if (id === null) return;
  db.get<User>(
    `SELECT id, username, email, age, timezone, display_name, created_at FROM users WHERE id = ?`,
    [id],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    }
  );
};

// Register routes

app.get("/habits", getHabits);
app.get("/habits/:id", getHabitById);
app.post("/habits", createHabit);
app.put("/habits/:id", updateHabit);
app.delete("/habits/:id", deleteHabit);

app.get("/completions", getCompletions);
app.get("/completions/:id", getCompletionById);
app.post("/completions", createOrUpdateCompletion);
app.delete("/completions/:id", deleteCompletion);

app.post("/register", registerUser);
app.post("/login", loginUser);
app.get("/users/:id", getUserById);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
