import type { Strings } from "./ru";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/**
 * Uzbek, Latin script. Uses the official letters ʻ (U+02BB) in oʻ/gʻ and ʼ (U+02BC) for the glottal stop.
 * Nouns after a number stay singular in Uzbek ("5 ta soʻz"), so no plural helper is needed.
 */
export const uzLatn: Strings = {
  loading: "Yuklanmoqda…",
  dbError: "Maʼlumotlar bazasini ochib boʻlmadi. Ilovani qayta ishga tushiring.",
  date: (day, currentYear) => {
    const [y, m, d] = day.split("-").map(Number);
    return `${y === currentYear ? "" : `${y}-yil `}${d}-${MONTHS[m - 1]}`;
  },
  home: {
    title: "CanLingo",
    settings: "Sozlamalar",
    today: "Bugun",
    newWords: "Yangi soʻzlar",
    reviews: "Takrorlash",
    start: "Boshlash",
    continue: "Davom etish",
    extra: (n) => `Yana ${n} ta takrorlash`,
    normDone: "Bugungi reja bajarildi",
    comeBack: "Bugun uchun shu. Ertaga qaytib keling.",
    recoveryTitle: "Tiklanish rejimi",
    recoveryText: (target, cap) =>
      `Takrorlashlar yigʻilib qoldi, shuning uchun yangi soʻzlar vaqtincha toʻxtatildi. ${target} ta kartadan keyin kun hisoblanadi, ${cap} tagacha qilish mumkin: shunda odatiy maromga tezroq qaytasiz.`,
    streak: (n) => `${n} kun ketma-ket`,
    level: (n) => `${n}-daraja`,
    xp: (into, span) => `${into} / ${span} XP`,
    goal: (remaining, date) => `${remaining} ta soʻz qoldi, kurs tugash sanasi: ${date}`,
    goalDone: "Kursdagi barcha soʻzlar oʻrganildi",
  },
  review: {
    title: "Takrorlash",
    left: (n) => `Qoldi: ${n}`,
    show: "Javobni koʻrsatish",
    listen: "Tinglash",
    normDone: "Reja bajarildi. Qolgani ixtiyoriy.",
    finish: "Tugatish",
    finished: "Tayyor!",
    finishedText: "Hozircha kartalar tugadi.",
    back: "Bosh sahifaga",
  },
  grades: { again: "Qayta", hard: "Qiyin", good: "Yaxshi", easy: "Oson" },
  interval: { lessThanMinute: "<1 daq", minute: "daq", hour: "soat", day: "kun", month: "oy", year: "yil" },
  onboarding: {
    paceTitle: "Kuniga nechta yangi soʻz?",
    paceHint: "Takrorlashlar cheklanmagan. Tezlikni sozlamalarda oʻzgartirish mumkin.",
    paceOption: (n) => `Kuniga ${n} ta soʻz`,
    paceNames: { 5: "Bemalol", 10: "Odatiy" },
    forecast: (date) => `A1–A2 kursi tugash sanasi: ${date}`,
    gameTitle: "Oʻyin rejimi",
    gameText: "Darajalar, XP va ketma-ket kunlar. Istalgan payt sozlamalarda oʻchirish mumkin.",
    gameOn: "Oʻyin bilan",
    gameOff: "Oʻyinsiz",
    next: "Keyingi",
    back: "Orqaga",
    done: "Oʻrganishni boshlash",
  },
  settings: {
    title: "Sozlamalar",
    language: "Interfeys va tarjima tili",
    pace: "Kuniga yangi soʻzlar",
    paceNote: "Yangi tezlik ertadan boshlab amal qiladi.",
    game: "Oʻyin rejimi",
    gameNote: "Darajalar, XP va ketma-ket kunlar. Rejim oʻchiq boʻlsa ham natijalar hisoblanadi.",
    dev: {
      title: "Ishlab chiquvchi uchun",
      clock: (date, days) => (days > 0 ? `Ilovadagi sana: ${date} (+${days} kun)` : `Ilovadagi sana: ${date}`),
      nextDay: "Keyingi kun",
      reset: "Natijalarni oʻchirish",
      resetTitle: "Natijalar oʻchirilsinmi?",
      resetText: "Barcha javoblar, kunlar va sozlamalar oʻchiriladi, ilova birinchi marta ishga tushirilgandek boshlanadi. Soʻzlar toʻplami qoladi.",
      cancel: "Bekor qilish",
      note: "Faqat ishlab chiqish rejimida koʻrinadi. «Keyingi kun» ilova soatini bir kun oldinga suradi, shunda takrorlashlarni kutmasdan tekshirish mumkin.",
    },
  },
};
