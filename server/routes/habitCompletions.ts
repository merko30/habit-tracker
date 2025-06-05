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

  return router;
}
