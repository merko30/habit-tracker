import { Router } from "express";
import sqlite3 from "sqlite3";
import { authMiddleware } from "../middleware/auth";

// You will need to pass db and JWT_SECRET from the main server file
export default function createHabitsRouter(db: sqlite3.Database) {
  const router = Router();

  // Helper: Validate ID param
  function validateId(idParam: string, res: any): number | null {
    const id = Number(idParam);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return null;
    }
    return id;
  }

  // GET /habits
  router.get("/", (req, res) => {
    db.all(`SELECT * FROM habits`, [], (err, habits) => {
      if (err) return res.status(500).json({ error: err.message });
      // ...existing code for streak and completed_today...
      // For brevity, you can move the streak logic here from the main file
      res.json(habits);
    });
  });

  // GET /habits/:id
  router.get("/:id", (req, res) => {
    const id = validateId(req.params.id, res);
    if (id === null) return;
    db.get("SELECT * FROM habits WHERE id = ?", [id], (err, habit) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!habit) return res.status(404).json({ error: "Habit not found" });
      res.json(habit);
    });
  });

  // POST /habits (protected)
  router.post("/", authMiddleware, (req, res) => {
    const user_id = (req as any).userId;
    const { title, frequency, tags } = req.body;
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
        db.get(
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
  });

  // PUT /habits/:id (protected)
  router.put("/:id", authMiddleware, (req, res) => {
    const id = validateId(req.params.id, res);
    if (id === null) return;
    const userId = (req as any).userId;
    const { title, frequency, tags } = req.body;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    if (title === undefined || frequency === undefined || tags === undefined) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    db.get(
      "SELECT * FROM habits WHERE id = ? AND user_id = ?",
      [id, userId],
      (err, habit) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!habit) {
          res.status(404).json({ error: "Habit not found or unauthorized" });
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
      }
    );
  });

  // DELETE /habits/:id (protected)
  router.delete("/:id", authMiddleware, (req, res) => {
    const id = validateId(req.params.id, res);
    if (id === null) return;
    const userId = (req as any).userId;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    db.get(
      "SELECT * FROM habits WHERE id = ? AND user_id = ?",
      [id, userId],
      (err, habit) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!habit) {
          res.status(404).json({ error: "Habit not found or unauthorized" });
          return;
        }
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
      }
    );
  });

  return router;
}
