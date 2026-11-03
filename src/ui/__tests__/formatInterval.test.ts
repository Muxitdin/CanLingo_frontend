import { describe, expect, it } from "@jest/globals";

import { ru } from "../../i18n/ru";
import { formatInterval } from "../formatInterval";

const min = 60_000;
const day = 24 * 60 * min;

describe("formatInterval", () => {
  it.each([
    [30_000, "<1 мин"],
    [min, "1 мин"],
    [10 * min, "10 мин"],
    [3 * 60 * min, "3 ч"],
    [day, "1 д"],
    [12 * day, "12 д"],
    [60 * day, "2 мес"],
    [365 * day, "1 г"],
    [548 * day, "1.5 г"],
  ])("%d ms is %s", (ms, label) => {
    expect(formatInterval(ms, ru.interval)).toBe(label);
  });
});
