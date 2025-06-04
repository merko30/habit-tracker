import { Router } from "express";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import sqlite3 from "sqlite3";

import { User } from "../types"; // Assuming you have a User type defined

import { authMiddleware, JWT_SECRET } from "../middleware/auth"; // Assuming you have a config file for your JWT secret

export default function createUsersRouter(db: sqlite3.Database) {
  const router = Router();

  // Register
  router.post("/register", async (req, res) => {
    const { username, email, password, age, timezone, display_name } = req.body;
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
            if (err.message.includes("UNIQUE constraint failed")) {
              res
                .status(400)
                .json({ error: "Username or email already exists" });
              return;
            }
            res.status(500).json({ error: err.message });
            return;
          }
          db.get(
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
  });

  // Login
  router.post("/login", (req, res) => {
    const { email, username, password } = req.body;
    if ((!email && !username) || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const query = email
      ? `SELECT * FROM users WHERE email = ?`
      : `SELECT * FROM users WHERE username = ?`;
    const value = email ? email : username;
    db.get(query, [value], async (err, user) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const match = await bcrypt.compare(password, (user as User).password);
      if (!match) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const { password: _pw, ...userData } = user as User;
      const token = sign({ id: (user as User).id }, JWT_SECRET, {
        expiresIn: "1d",
      });
      res.json({ user: userData, token });
    });
  });

  // Get user by id
  router.get("/profile", authMiddleware, (req, res) => {
    const id = (req as any).userId; // Assuming userId is set by auth middleware
    db.get(
      `SELECT id, username, email, age, timezone, display_name, created_at FROM users WHERE id = ?`,
      [id],
      (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
      }
    );
  });

  // Update user profile
  router.put("/profile", authMiddleware, (req, res) => {
    const id = (req as any).userId; // Assuming userId is set by auth middleware

    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });
      const { name, age, timeZone } = req.body;
      const updates: string[] = [];
      const params: (string | number | null)[] = [];
      if (name) {
        updates.push("display_name = ?");
        params.push(name);
      }
      if (age !== undefined) {
        updates.push("age = ?");
        params.push(age);
      }
      if (timeZone) {
        updates.push("timezone = ?");
        params.push(timeZone);
      }
      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }
      params.push(id);
      db.run(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        params,
        function (this: sqlite3.RunResult, err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: "User not found" });
          }
          db.get(
            `SELECT id, username, email, age, timezone, display_name, created_at FROM users WHERE id = ?`,
            [id],
            (err, updatedUser) => {
              if (err) return res.status(500).json({ error: err.message });
              if (!updatedUser)
                return res.status(404).json({ error: "User not found" });
              res.json(updatedUser);
            }
          );
        }
      );
    });
  });

  return router;
}
