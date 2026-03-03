import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import SimulationPage from "./page";

describe("SimulationPage", () => {
  it("renders without crashing", () => {
    const html = renderToString(<SimulationPage />);
    expect(html).toContain("Lign");
    expect(html).toContain("Impact comparatif");
  });
});
