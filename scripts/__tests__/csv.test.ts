import { describe, expect, it } from "@jest/globals";

import { parseCsv, parseCsvRecords, toCsv } from "../lib/csv";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and newlines inside fields", () => {
    const text = 'a,b,c\n"x, y","say ""hi""","two\nlines"\r\nplain,,end\n';
    expect(parseCsv(text)).toEqual([
      ["a", "b", "c"],
      ["x, y", 'say "hi"', "two\nlines"],
      ["plain", "", "end"],
    ]);
  });

  it("drops a BOM and blank lines", () => {
    expect(parseCsv("﻿a,b\n\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("rejects an unterminated quote", () => {
    expect(() => parseCsv('a,"b\n')).toThrow(/quoted/);
  });
});

describe("parseCsvRecords", () => {
  it("keys rows by header and rejects ragged rows", () => {
    expect(parseCsvRecords("id,word\n1,hello\n")).toEqual([{ id: "1", word: "hello" }]);
    expect(() => parseCsvRecords("id,word\n1\n")).toThrow(/row 2/);
  });
});

describe("toCsv", () => {
  it("round-trips through parseCsv", () => {
    const rows = [
      ["id", "example"],
      ["1", 'He said "no", then left.'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
