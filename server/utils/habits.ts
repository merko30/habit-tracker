// Utility helpers for habit period, streak, and ISO week logic

/**
 * Get ISO week number (ISO-8601, weeks start on Monday, week 1 is the week with the first Thursday)
 */
export function getISOWeekNumber(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

/**
 * Get the period date string for a habit based on its frequency and a reference date.
 * Returns:
 *   - daily: YYYY-MM-DD
 *   - weekly: YYYY-Www
 *   - monthly: YYYY-MM
 */
export function getPeriodDate(frequency: string, date: Date): string {
  if (frequency === "weekly") {
    const weekNumber = getISOWeekNumber(date);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
  } else if (frequency === "monthly") {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  } else {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Calculate the streak for a habit given its frequency and a list of completion dates (descending order).
 * Dates should be strings in the same format as getPeriodDate returns.
 */
export function calculateStreak(
  frequency: string,
  completions: { date: string }[],
  now: Date = new Date()
): number {
  let streak = 0;
  if (frequency === "daily") {
    let current: Date | null = null;
    for (const row of completions) {
      if (!row.date || isNaN(Date.parse(row.date))) continue;
      const rowDate = new Date(row.date);
      if (streak === 0) current = rowDate;
      if (
        current &&
        rowDate.toISOString().slice(0, 10) ===
          current.toISOString().slice(0, 10)
      ) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (frequency === "weekly") {
    let year = now.getFullYear();
    let week = getISOWeekNumber(now);
    const completedWeeks = new Set(completions.map((r) => r.date));
    while (true) {
      const weekStr = `${year}-W${week.toString().padStart(2, "0")}`;
      if (completedWeeks.has(weekStr)) {
        streak++;
        week--;
        if (week === 0) {
          year--;
          const lastDay = new Date(year, 11, 31);
          week = getISOWeekNumber(lastDay);
        }
      } else {
        break;
      }
    }
  } else if (frequency === "monthly") {
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    const completedMonths = new Set(completions.map((r) => r.date));
    while (true) {
      const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
      if (completedMonths.has(monthStr)) {
        streak++;
        month--;
        if (month === 0) {
          year--;
          month = 12;
        }
      } else {
        break;
      }
    }
  }
  return streak;
}
