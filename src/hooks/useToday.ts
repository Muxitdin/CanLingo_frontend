import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { db } from "../db/client";
import { todaySummary, type TodaySummary } from "./study";

/** Today's plan and progress for the home screen, refreshed whenever the screen comes back into view. */
export function useToday(): TodaySummary {
  const [summary, setSummary] = useState(() => todaySummary(db, new Date()));

  useFocusEffect(
    useCallback(() => {
      setSummary(todaySummary(db, new Date()));
    }, []),
  );

  return summary;
}
