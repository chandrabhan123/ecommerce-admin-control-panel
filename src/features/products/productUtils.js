// Format DummyJSON category slugs for readable table labels.
export function formatCategory(category) {
  if (typeof category !== "string" || !category.trim()) return "Uncategorized";

  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
