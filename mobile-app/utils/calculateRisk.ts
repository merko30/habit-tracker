import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

import { getCompletions } from "@/api/completions";
import { HabitCompletion } from "@/types";

export default function calculateHabitRisk(completions: HabitCompletion[]) {
  // Only use daily completions (YYYY-MM-DD)
  const dailyCompletions = completions.filter((c) =>
    /^\d{4}-\d{2}-\d{2}$/.test(c.date)
  );
  const completionsByDay: Record<string, { total: number; missed: number }> = {
    Sunday: { total: 0, missed: 0 },
    Monday: { total: 0, missed: 0 },
    Tuesday: { total: 0, missed: 0 },
    Wednesday: { total: 0, missed: 0 },
    Thursday: { total: 0, missed: 0 },
    Friday: { total: 0, missed: 0 },
    Saturday: { total: 0, missed: 0 },
  };

  for (const entry of dailyCompletions) {
    const day = new Date(entry.date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    completionsByDay[day].total += 1;
    if (!entry.completed) completionsByDay[day].missed += 1;
  }

  const riskByDay: Record<string, number> = {};

  for (const [day, { total, missed }] of Object.entries(completionsByDay)) {
    if (total > 0) {
      riskByDay[day] = missed / total; // percentage skipped
    }
  }

  return riskByDay;
}

const RISK_NOTE_MAP = {
  Sunday:
    "Sunday is a day of rest, but don't let it become a habit to skip your goals.",
  Monday:
    "Monday sets the tone for the week. Don't start it with missed goals.",
  Tuesday: "Tuesday is a great day to catch up. Make sure you stay on track.",
  Wednesday: "Midweek is crucial. Don't let your momentum slip.",
  Thursday: "Thursday is almost there. Keep pushing through!",
  Friday: "Finish the week strong. Don't let Friday be a day of excuses.",
  Saturday: "Saturday can be relaxing, but don't forget your commitments.",
};

export const useCalculateRisk = () => {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadAndCalculateRisk = async () => {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        return;
      }

      try {
        const completions = await getCompletions();
        const riskByDay = calculateHabitRisk(completions);

        // if today is high risk day, set note
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });

        if (
          riskByDay[today] &&
          riskByDay[today] >= 0.5 &&
          completions.find(
            (c: HabitCompletion) =>
              new Date(c.date).toLocaleDateString("en-US", {
                weekday: "long",
              }) === today && !c.completed
          )
        ) {
          setNote(
            RISK_NOTE_MAP[today as keyof typeof RISK_NOTE_MAP] ||
              "High risk day detected. Stay focused!"
          );
        } else {
          setNote(null);
        }
      } catch (error) {
        console.error("Failed to calculate risk:", error);
        setNote("Failed to calculate risk");
      }
    };

    loadAndCalculateRisk();
  }, []);

  return note;
};
