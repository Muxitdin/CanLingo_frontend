import { describe, expect, it } from "@jest/globals";

import { plural } from "../ru";

describe("plural", () => {
  const forms = ["день", "дня", "дней"] as const;
  it.each([
    [1, "день"],
    [2, "дня"],
    [5, "дней"],
    [11, "дней"],
    [12, "дней"],
    [21, "день"],
    [22, "дня"],
    [111, "дней"],
  ])("%d → %s", (n, word) => {
    expect(plural(n, forms)).toBe(word);
  });
});
