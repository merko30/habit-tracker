import { Router } from "express";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import prisma from "../prisma/client";

import { authMiddleware, JWT_SECRET } from "../middleware/auth";

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
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        age: age ?? null,
        timezone: timezone ?? null,
        display_name: display_name ?? null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        timezone: true,
        display_name: true,
        created_at: true,
      },
    });
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(400).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, username, password } = req.body;
  if ((!email && !username) || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const user = await prisma.user.findFirst({
      where: email ? { email } : { username },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const { password: _pw, ...userData } = user;
    const token = sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ user: userData, token });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by id
router.get("/profile", authMiddleware, async (req, res) => {
  const id = (req as any).userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        timezone: true,
        display_name: true,
        created_at: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
    return;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    return;
  }
});

// Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
  const id = (req as any).userId;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { name, age, timeZone } = req.body;
    const data: any = {};
    if (name) data.display_name = name;
    if (age !== undefined) data.age = age;
    if (timeZone) data.timezone = timeZone;
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    await prisma.user.update({
      where: { id },
      data,
    });
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        timezone: true,
        display_name: true,
        created_at: true,
      },
    });
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updatedUser);
    return;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    return;
  }
});

export default router;
