import express, { Response, RequestHandler } from "express";
import sqlite3 from "sqlite3";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// SQLite DB setup
const db = new sqlite3.Database(path.join(__dirname, "habits.db"));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    frequency TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    streak_count INTEGER DEFAULT 0
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
  created_at: string;
  streak_count: number;
}

interface HabitCompletion {
  id: number;
  habit_id: number;
  date: string; // ISO date string yyyy-mm-dd
  completed: boolean;
}

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
  db.all<Habit[]>("SELECT * FROM habits", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

const getHabitById: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;

  db.get<Habit>("SELECT * FROM habits WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    res.json(row);
  });
};

const createHabit: RequestHandler = (req, res): void => {
  const { title, frequency } = req.body as {
    title?: string;
    frequency?: string;
  };
  if (!title || !frequency) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  db.run(
    "INSERT INTO habits (title, frequency) VALUES (?, ?)",
    [title, frequency],
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
          res.status(201).json(row);
        }
      );
    }
  );
};

const updateHabit: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;

  const { title, frequency, streak_count } = req.body as {
    title?: string;
    frequency?: string;
    streak_count?: number;
  };

  if (
    title === undefined ||
    frequency === undefined ||
    streak_count === undefined
  ) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  db.run(
    "UPDATE habits SET title = ?, frequency = ?, streak_count = ? WHERE id = ?",
    [title, frequency, streak_count, id],
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

const createCompletion: RequestHandler = (req, res): void => {
  const { habit_id, date, completed } = req.body as {
    habit_id?: number;
    date?: string;
    completed?: boolean;
  };

  if (!habit_id || !date || typeof completed !== "boolean") {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  db.run(
    "INSERT INTO habit_completions (habit_id, date, completed) VALUES (?, ?, ?)",
    [habit_id, date, completed ? 1 : 0],
    function (this: sqlite3.RunResult, err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.get<HabitCompletion>(
        "SELECT * FROM habit_completions WHERE id = ?",
        [this.lastID],
        (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.status(201).json({ ...row, completed: Boolean(row.completed) });
        }
      );
    }
  );
};

const updateCompletion: RequestHandler<{ id: string }> = (req, res): void => {
  const id = validateId(req.params.id, res);
  if (id === null) return;

  const { completed } = req.body as { completed?: boolean };

  if (typeof completed !== "boolean") {
    res.status(400).json({ error: "Missing or invalid 'completed' field" });
    return;
  }

  db.run(
    "UPDATE habit_completions SET completed = ? WHERE id = ?",
    [completed ? 1 : 0, id],
    function (this: sqlite3.RunResult, err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ updated: this.changes });
    }
  );
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

// Register routes

app.get("/habits", getHabits);
app.get("/habits/:id", getHabitById);
app.post("/habits", createHabit);
app.put("/habits/:id", updateHabit);
app.delete("/habits/:id", deleteHabit);

app.get("/completions", getCompletions);
app.get("/completions/:id", getCompletionById);
app.post("/completions", createCompletion);
app.put("/completions/:id", updateCompletion);
app.delete("/completions/:id", deleteCompletion);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
