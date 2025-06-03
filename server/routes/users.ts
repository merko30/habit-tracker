import { Router } from "express";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import sqlite3 from "sqlite3";

import { User } from "../types"; // Assuming you have a User type defined

import { JWT_SECRET } from "../middleware/auth"; // Assuming you have a config file for your JWT secret

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
  router.get("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
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

  return router;
}
