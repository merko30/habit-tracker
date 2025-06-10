import { Router } from "express";
import prisma from "../prisma/client";
import { authMiddleware } from "../middleware/auth";
import { getPeriodDate } from "../utils/habits";

const router = Router();

// GET /completions
router.get("/", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const completions = await prisma.habitCompletion.findMany({
      where: {
        habit: { user_id: userId },
      },
      orderBy: { date: "desc" },
    });
    const result = completions.map((row) => ({
      ...row,
      completed: Boolean(row.completed),
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /completions/:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const row = await prisma.habitCompletion.findUnique({ where: { id } });
    if (!row) {
      res.status(404).json({ error: "Completion not found" });
      return;
    }
    res.json({ ...row, completed: Boolean(row.completed) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /completions
router.post("/", authMiddleware, async (req, res) => {
  const { habit_id, date, completed, frequency } = req.body;
  if (!habit_id || !date || typeof completed !== "boolean" || !frequency) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  try {
    // Upsert by habit_id + date
    const upserted = await prisma.habitCompletion.upsert({
      where: { habit_id_date: { habit_id, date } },
      update: { completed },
      create: { habit_id, date, completed },
    });
    res
      .status(200)
      .json({ ...upserted, completed: Boolean(upserted.completed), frequency });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /completions/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const deleted = await prisma.habitCompletion.delete({ where: { id } });
    res.json({ deleted: deleted ? 1 : 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /completions/stats/:habitId
router.get("/stats/:habitId", authMiddleware, async (req, res) => {
  const habitId = Number(req.params.habitId);
  if (isNaN(habitId)) {
    res.status(400).json({ error: "Invalid habit ID" });
    return;
  }
  const userId = (req as any).userId;
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, user_id: userId },
    });
    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    const frequency = habit.frequency;
    const now = new Date();
    if (frequency === "weekly") {
      const weekStr = getPeriodDate("weekly", now);
      const monthStr = getPeriodDate("monthly", now);
      const [weekRows, monthRows] = await Promise.all([
        prisma.habitCompletion.findMany({
          where: { habit_id: habitId, date: weekStr },
        }),
        prisma.habitCompletion.findMany({
          where: { habit_id: habitId, date: monthStr },
        }),
      ]);
      res.json({
        habit: {
          id: habit.id,
          title: habit.title,
          frequency: habit.frequency,
          tags: habit.tags ? JSON.parse(habit.tags) : [],
          created_at: habit.created_at,
        },
        week: weekRows.map((r) => ({
          date: r.date,
          completed: Boolean(r.completed),
        })),
        month: monthRows.map((r) => ({
          date: r.date,
          completed: Boolean(r.completed),
        })),
      });
    } else if (frequency === "monthly") {
      // For monthly, week = completions from Monday of current week
      const dayOfWeek = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      const mondayStr = monday.toISOString().slice(0, 10);
      const monthStr = getPeriodDate("monthly", now);
      const [weekRows, monthRows] = await Promise.all([
        prisma.habitCompletion.findMany({
          where: {
            habit_id: habitId,
            date: { gte: mondayStr },
          },
          orderBy: { date: "asc" },
        }),
        prisma.habitCompletion.findMany({
          where: { habit_id: habitId, date: monthStr },
        }),
      ]);
      res.json({
        habit: {
          id: habit.id,
          title: habit.title,
          frequency: habit.frequency,
          tags: habit.tags ? JSON.parse(habit.tags) : [],
          created_at: habit.created_at,
        },
        week: weekRows.map((r) => ({
          date: r.date,
          completed: Boolean(r.completed),
        })),
        month: monthRows.map((r) => ({
          date: r.date,
          completed: Boolean(r.completed),
        })),
      });
    } else {
      // daily
      const dayOfWeek = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      const mondayStr = monday.toISOString().slice(0, 10);
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);
      const [weekRows, monthRows] = await Promise.all([
        prisma.habitCompletion.findMany({
          where: {
            habit_id: habitId,
            date: { gte: mondayStr },
          },
          orderBy: { date: "asc" },
        }),
        prisma.habitCompletion.findMany({
          where: {
            habit_id: habitId,
            date: { gte: firstOfMonthStr },
          },
          orderBy: { date: "asc" },
        }),
      ]);
      res.json({
        habit: {
          id: habit.id,
          title: habit.title,
          frequency: habit.frequency,
          tags: habit.tags ? JSON.parse(habit.tags) : [],
          created_at: habit.created_at,
        },
        week: weekRows.map((r) => ({
          date: r.date,
          completed: Boolean(r.completed),
        })),
        month: monthRows.map((r) => ({
          date: r.date,
          completed: Boolean(r.completed),
        })),
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
