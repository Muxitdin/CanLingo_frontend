import { useRef, useState } from "react";

import { db } from "../db/client";
import { getProfile } from "../db/profile";
import { isNormComplete } from "../domain/dailyPlan";
import type { Grade } from "../domain/fsrs";
import { now as clockNow } from "../services/clock";
import { answerCard, buildSession, cardView, ensureDayPlan, type CardView, type SessionItem } from "./study";

interface SessionState {
  queue: SessionItem[];
  card: CardView | null;
  revealed: boolean;
  normComplete: boolean;
}

function load(queue: SessionItem[], now: Date): SessionState {
  const lang = getProfile(db).uiLang;
  return {
    queue,
    card: queue[0] ? cardView(db, queue[0].cardId, lang, now) : null,
    revealed: false,
    normComplete: isNormComplete(ensureDayPlan(db, now)),
  };
}

/**
 * One review session. The queue is built when the screen opens; cards still in learning
 * go back to the end of it. Every answer is saved right away, so leaving mid-session loses nothing.
 */
export function useReviewSession() {
  const [state, setState] = useState(() => {
    const now = clockNow();
    return load(buildSession(db, now), now);
  });
  // Guards against a double tap answering the same item twice before the next render.
  const lastAnswered = useRef<SessionItem | null>(null);

  function reveal() {
    setState((s) => ({ ...s, revealed: true }));
  }

  function answer(rating: Grade) {
    const item = state.queue[0];
    if (!item || lastAnswered.current === item) return;
    lastAnswered.current = item;

    const now = clockNow();
    const { repeat } = answerCard(db, item, rating, now);
    const rest = state.queue.slice(1);
    if (repeat) rest.push({ cardId: item.cardId, kind: "repeat" });
    setState(load(rest, now));
  }

  return {
    card: state.card,
    revealed: state.revealed,
    left: state.queue.length,
    normComplete: state.normComplete,
    reveal,
    answer,
  };
}
