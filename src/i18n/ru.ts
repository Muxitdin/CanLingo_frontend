/** Russian plural form: plural(5, ["день", "дня", "дней"]) is "дней". */
export function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const words = (n: number) => `${n} ${plural(n, ["слово", "слова", "слов"])}`;
const cards = (n: number) => `${n} ${plural(n, ["карточки", "карточек", "карточек"])}`;

export const ru = {
  loading: "Загрузка…",
  dbError: "Не удалось открыть базу данных. Перезапустите приложение.",
  /** A study day (YYYY-MM-DD) as "12 марта", with the year when it isn't `currentYear`. */
  date: (day: string, currentYear: number) => {
    const [y, m, d] = day.split("-").map(Number);
    return `${d} ${MONTHS[m - 1]}${y === currentYear ? "" : ` ${y}`}`;
  },
  home: {
    title: "CanLingo",
    settings: "Настройки",
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
      `Накопились повторения, поэтому новые слова на паузе. День засчитается после ${cards(target)}, можно пройти до ${cap}: так вы вернётесь к обычному ритму быстрее.`,
    streak: (n: number) => `${n} ${plural(n, ["день", "дня", "дней"])} подряд`,
    level: (n: number) => `Уровень ${n}`,
    xp: (into: number, span: number) => `${into} / ${span} XP`,
    goal: (remaining: number, date: string) => `Осталось ${words(remaining)}, курс закончите к ${date}`,
    goalDone: "Все слова курса пройдены",
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
  onboarding: {
    paceTitle: "Сколько новых слов в день?",
    paceHint: "Повторения не ограничены. Темп можно поменять в настройках.",
    paceOption: (n: number) => `${words(n)} в день`,
    paceNames: { 5: "Спокойно", 10: "Обычно" } as Record<number, string>,
    forecast: (date: string) => `Курс A1–A2 закончите к ${date}`,
    gameTitle: "Игровой режим",
    gameText: "Уровни, XP и серия дней подряд. Выключить можно в любой момент в настройках.",
    gameOn: "С игрой",
    gameOff: "Без игры",
    next: "Дальше",
    back: "Назад",
    done: "Начать учиться",
  },
  settings: {
    title: "Настройки",
    language: "Язык интерфейса и переводов",
    pace: "Новых слов в день",
    paceNote: "Новый темп начнёт действовать завтра.",
    game: "Игровой режим",
    gameNote: "Уровни, XP и серия дней. Прогресс считается и когда режим выключен.",
  },
};

export type Strings = typeof ru;
