import { describe, expect, it } from "vitest";
import { formatCategory } from "./productUtils";

describe("formatCategory", () => {
  it("turns DummyJSON category slugs into readable labels", () => {
    expect(formatCategory("mens-shirts")).toBe("Mens Shirts");
  });

  it("uses a fallback when the category is missing", () => {
    expect(formatCategory("")).toBe("Uncategorized");
    expect(formatCategory(null)).toBe("Uncategorized");
  });
});
