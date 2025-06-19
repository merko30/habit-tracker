export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function getCurrentWeekDates() {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 (Mon) - 6 (Sun)
  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOfWeek + i);
    const year = d.getFullYear();
    const month = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    week.push(`${year}-${month}-${day}`);
  }
  return week;
}

export function getCurrentMonthDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = getDaysInMonth(year, month);
  const dates: { date: string; isCurrentMonth: boolean }[] = [];

  // Find the weekday of the 1st of the month (0=Mon, 6=Sun)
  const firstDay = new Date(year, month, 1);
  let firstWeekday = (firstDay.getDay() + 6) % 7; // 0=Mon

  // Add days from previous month if needed
  if (firstWeekday > 0) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = prevMonthDays - firstWeekday + 1; i <= prevMonthDays; i++) {
      const m = pad2(prevMonth + 1);
      const d = pad2(i);
      dates.push({ date: `${prevYear}-${m}-${d}`, isCurrentMonth: false });
    }
  }

  // Add current month days
  for (let i = 1; i <= days; i++) {
    const m = pad2(month + 1);
    const d = pad2(i);
    dates.push({ date: `${year}-${m}-${d}`, isCurrentMonth: true });
  }

  return dates;
}

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper: get ISO week string for a row (assume all dates in row are in the same week)
export function getISOWeekStr(row: (string | { date: string })[]) {
  const firstDate = typeof row[0] === "string" ? row[0] : row[0].date;
  const d = new Date(firstDate);
  d.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}
