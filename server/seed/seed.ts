import prisma from "../prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      age: 25,
      timezone: "UTC",
      display_name: "Test User",
    },
  });

  // Habits
  const habits = await prisma.habit.createMany({
    data: [
      {
        user_id: user.id,
        title: "Morning Workout",
        frequency: "daily",
        tags: JSON.stringify(["health", "fitness"]),
      },
      {
        user_id: user.id,
        title: "Read Book",
        frequency: "daily",
        tags: JSON.stringify(["learning", "personal"]),
      },
      {
        user_id: user.id,
        title: "Weekly Planning",
        frequency: "weekly",
        tags: JSON.stringify(["organization", "focus"]),
      },
      {
        user_id: user.id,
        title: "Monthly Reflection",
        frequency: "monthly",
        tags: JSON.stringify(["mindfulness", "growth"]),
      },
    ],
  });

  // Completions for daily habits (up to today)
  const today = new Date();
  const startDate = new Date("2025-05-19");
  let d = new Date(startDate);
  let toggle = false;
  const completions: any[] = [];
  while (d <= today) {
    const dateStr = d.toISOString().slice(0, 10);
    completions.push({ habit_id: 1, date: dateStr, completed: toggle });
    completions.push({ habit_id: 2, date: dateStr, completed: !toggle });
    d.setDate(d.getDate() + 1);
    toggle = !toggle;
  }

  // Weekly completions (simulate 4 weeks)
  function getWeekStr(date: Date) {
    const year = date.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const weekNumber = Math.ceil(
      ((date.getTime() - jan1.getTime()) / 86400000 + 1) / 7
    );
    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
  }
  let weekStart = new Date("2025-05-19");
  for (let i = 0; i < 4; i++) {
    const weekStr = getWeekStr(weekStart);
    completions.push({ habit_id: 3, date: weekStr, completed: i % 2 === 0 });
    weekStart.setDate(weekStart.getDate() + 7);
  }

  // Monthly completions (simulate 3 months)
  let monthStart = new Date("2025-04-01");
  for (let i = 0; i < 3; i++) {
    const monthStr = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    completions.push({ habit_id: 4, date: monthStr, completed: i % 2 === 1 });
    monthStart.setMonth(monthStart.getMonth() + 1);
  }

  // Insert completions
  for (const c of completions) {
    await prisma.habitCompletion.upsert({
      where: { habit_id_date: { habit_id: c.habit_id, date: c.date } },
      update: { completed: c.completed },
      create: c,
    });
  }

  console.log("Seed complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
