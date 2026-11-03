/** Russian plural form: plural(5, ["день", "дня", "дней"]) is "дней". */
export function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const ru = {
  loading: "Загрузка…",
  dbError: "Не удалось открыть базу данных. Перезапустите приложение.",
  home: {
    title: "CanLingo",
    today: "Сегодня",
    newWords: "Новые слова",
    reviews: "Повторения",
    start: "Начать",
    continue: "Продолжить",
    extra: (n: number) => `Повторить ещё ${n}`,
    normDone: "Норма на сегодня выполнена",
    comeBack: "На сегодня всё. Возвращайтесь завтра.",
    recoveryTitle: "Режим восстановления",
    recoveryText: (target: number, cap: number) =>
      `Накопились повторения, поэтому новые слова на паузе. День засчитается после ${target} ${plural(target, ["карточки", "карточек", "карточек"])}, можно пройти до ${cap}: так вы вернётесь к обычному ритму быстрее.`,
    streak: (n: number) => `${n} ${plural(n, ["день", "дня", "дней"])} подряд`,
    level: (n: number) => `Уровень ${n}`,
    xp: (into: number, span: number) => `${into} / ${span} XP`,
  },
  review: {
    title: "Повторение",
    left: (n: number) => `Осталось: ${n}`,
    show: "Показать ответ",
    listen: "Произнести",
    normDone: "Норма выполнена. Остальное по желанию.",
    finish: "Закончить",
    finished: "Готово!",
    finishedText: "Карточки на сейчас закончились.",
    back: "На главную",
  },
  grades: { again: "Снова", hard: "Трудно", good: "Хорошо", easy: "Легко" },
  interval: { lessThanMinute: "<1 мин", minute: "мин", hour: "ч", day: "д", month: "мес", year: "г" },
} as const;

export type Strings = typeof ru;
