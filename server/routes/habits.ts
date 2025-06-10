import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import prisma from "../prisma/client";
import {
  getPeriodDate,
  getISOWeekNumber,
  calculateStreak,
} from "../utils/habits";

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
router.get("/", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const habits = await prisma.habit.findMany({ where: { user_id: userId } });
    if (!habits.length) {
      res.json([]);
      return;
    }
    const result: any[] = [];
    await Promise.all(
      habits.map(async (habit: any) => {
        const now = new Date();
        const periodDate = getPeriodDate(habit.frequency, now);
        const completionRow = await prisma.habitCompletion.findFirst({
          where: { habit_id: habit.id, completed: true, date: periodDate },
          select: { id: true },
        });
        const completions = await prisma.habitCompletion.findMany({
          where: { habit_id: habit.id, completed: true },
          orderBy: { date: "desc" },
          select: { date: true },
        });
        const streak = calculateStreak(habit.frequency, completions, now);
        result.push({
          ...habit,
          tags: JSON.parse(habit.tags || "[]"),
          streak_count: streak,
          completed_today: !!(completionRow && completionRow.id !== undefined),
          total_completions: completions.length,
          todays_completion_id:
            completionRow && completionRow.id !== undefined
              ? completionRow.id
              : null,
        });
      })
    );
    res.json(result);
    return;
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
    return;
  }
});

// GET /habits/:id
router.get("/:id", authMiddleware, async (req, res) => {
  const id = validateId(req.params.id, res);
  if (id === null) return;
  const userId = (req as any).userId;
  try {
    const habit = await prisma.habit.findFirst({
      where: { id, user_id: userId },
    });
    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }
    const now = new Date();
    const periodDate = getPeriodDate(habit.frequency, now);
    const completion = await prisma.habitCompletion.findFirst({
      where: { habit_id: id, completed: true, date: periodDate },
    });
    res.json({
      ...habit,
      tags: JSON.parse(habit.tags || "[]"),
      todays_completion_id: completion ? completion.id : null,
    });
    return;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    return;
  }
});

// POST /habits (protected)
router.post("/", authMiddleware, async (req, res) => {
  const user_id = (req as any).userId;
  const { title, frequency, tags } = req.body;
  if (!user_id || !title || !frequency || !Array.isArray(tags)) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  try {
    const habit = await prisma.habit.create({
      data: {
        user_id,
        title,
        frequency,
        tags: JSON.stringify(tags),
      },
    });
    res.status(201).json({
      id: habit.id,
      user_id: habit.user_id,
      title: habit.title,
      frequency: habit.frequency,
      tags: JSON.parse(habit.tags || "[]"),
      created_at: habit.created_at,
      streak_count: 0,
      completed_today: false,
      total_completions: 0,
    });
    return;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    return;
  }
});

// PUT /habits/:id (protected)
router.put("/:id", authMiddleware, async (req, res) => {
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
  try {
    const habit = await prisma.habit.findFirst({
      where: { id, user_id: userId },
    });
    if (!habit) {
      res.status(404).json({ error: "Habit not found or unauthorized" });
      return;
    }
    const oldFrequency = habit.frequency;
    await prisma.habit.update({
      where: { id },
      data: {
        title,
        frequency,
        tags: JSON.stringify(tags),
      },
    });
    if (oldFrequency !== frequency) {
      await prisma.habitCompletion.deleteMany({ where: { habit_id: id } });
    }
    const updatedHabit = await prisma.habit.findUnique({ where: { id } });
    const totalCompletions = await prisma.habitCompletion.count({
      where: { habit_id: id, completed: true },
    });
    const now = new Date();
    const periodDate = getPeriodDate(frequency, now);
    const completedToday = await prisma.habitCompletion.findFirst({
      where: { habit_id: id, completed: true, date: periodDate },
    });
    const completions = await prisma.habitCompletion.findMany({
      where: { habit_id: id, completed: true },
      orderBy: { date: "desc" },
      select: { date: true },
    });
    const streak = calculateStreak(frequency, completions, now);
    res.json({
      id: updatedHabit?.id,
      user_id: updatedHabit?.user_id,
      title: updatedHabit?.title,
      frequency: updatedHabit?.frequency,
      tags: JSON.parse(updatedHabit?.tags || "[]"),
      created_at: updatedHabit?.created_at,
      streak_count: streak,
      completed_today: !!completedToday,
      total_completions: totalCompletions,
    });
    return;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    return;
  }
});

// DELETE /habits/:id (protected)
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = validateId(req.params.id, res);
  if (id === null) return;
  const userId = (req as any).userId;
  if (!userId) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }
  try {
    const habit = await prisma.habit.findFirst({
      where: { id, user_id: userId },
    });
    if (!habit) {
      res.status(404).json({ error: "Habit not found or unauthorized" });
      return;
    }
    await prisma.habitCompletion.deleteMany({ where: { habit_id: id } });
    await prisma.habit.delete({ where: { id } });
    res.json({ success: true });
    return;
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    return;
  }
});

export default router;
