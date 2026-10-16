import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AppRoutes from "./AppRoutes";

describe("AppRoutes", () => {
  it("shows a helpful not-found page for unknown paths", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-admin-page"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Dashboard" })).toHaveAttribute("href", "/");
  });
});
