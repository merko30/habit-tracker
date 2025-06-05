import { Router } from "express";
import sqlite3 from "sqlite3";
import { HabitCompletion } from "../types";
import { authMiddleware } from "../middleware/auth";

export default function createHabitCompletionsRouter(db: sqlite3.Database) {
  const router = Router();

  // GET /completions
  router.get("/", authMiddleware, (req, res) => {
    const userId = (req as any).userId;
    db.all(
      // habit user id
      "SELECT * FROM habit_completions WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ?) ORDER BY date DESC",
      [userId],
      (err, rows: HabitCompletion[]) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        const result = rows.map((row) => ({
          ...row,
          completed: Boolean(row.completed),
        }));
        res.json(result);
      }
    );
  });

  // GET /completions/:id
  router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    db.get(
      "SELECT * FROM habit_completions WHERE id = ?",
      [id],
      (err, row: HabitCompletion) => {
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
  });

  // POST /completions
  router.post("/", authMiddleware, (req, res) => {
    const { habit_id, date, completed } = req.body;
    if (!habit_id || !date || typeof completed !== "boolean") {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    db.serialize(() => {
      db.get(
        `SELECT completed FROM habit_completions WHERE habit_id = ? AND date = ?`,
        [habit_id, date],
        (err, existing) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          db.run(
            `INSERT INTO habit_completions (habit_id, date, completed)
            VALUES (?, ?, ?)
            ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed`,
            [habit_id, date, completed ? 1 : 0],
            function (this: sqlite3.RunResult, err) {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              db.get(
                `SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?`,
                [habit_id, date],
                (err, row: HabitCompletion) => {
                  if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  res
                    .status(200)
                    .json({ ...row, completed: Boolean(row.completed) });
                }
              );
            }
          );
        }
      );
    });
  });

  // DELETE /completions/:id
  router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
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
  });

  // get completions for current week and month for a habit
  // week:[], month:[]
  router.get("/stats/:habitId", authMiddleware, (req, res) => {
    const habitId = Number(req.params.habitId);
    if (isNaN(habitId)) {
      res.status(400).json({ error: "Invalid habit ID" });
      return;
    }
    const userId = (req as any).userId;
    // Get current date
    const now = new Date();
    // Get Monday of current week
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 (Mon) - 6 (Sun)
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    const mondayStr = monday.toISOString().slice(0, 10);
    // Get first day of current month
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);
    db.serialize(() => {
      // Get weekly completions (from Monday)
      db.all(
        `SELECT date, completed FROM habit_completions 
         WHERE habit_id = ? AND date >= ? 
         ORDER BY date`,
        [habitId, mondayStr],
        (err, weekRows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          // Get monthly completions (from 1st of month)
          db.all(
            `SELECT date, completed FROM habit_completions 
             WHERE habit_id = ? AND date >= ? 
             ORDER BY date`,
            [habitId, firstOfMonthStr],
            (err, monthRows) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              const weekData = (weekRows as any[]).map((row) => ({
                date: row.date,
                completed: Boolean(row.completed),
              }));
              const monthData = (monthRows as any[]).map((row) => ({
                date: row.date,
                completed: Boolean(row.completed),
              }));
              res.json({ week: weekData, month: monthData });
            }
          );
        }
      );
    });
  });
  return router;
}
