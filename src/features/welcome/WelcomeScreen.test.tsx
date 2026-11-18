import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import WelcomeScreen from "./WelcomeScreen.tsx";

test("renders a browser-only demo without requiring a service", () => {
  render(<WelcomeScreen />);

  expect(
    screen.getByRole("heading", { name: "Browser-only scheduling demo" }),
  ).toBeTruthy();
  expect(
    screen.getByText(
      "Explore the demo foundation entirely in your browser. No account, server connection, or live integration is required.",
    ),
  ).toBeTruthy();
});
