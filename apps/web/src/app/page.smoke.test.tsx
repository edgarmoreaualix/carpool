import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import HomePage from "./page";

describe("home page", () => {
  it("renders landing hero and simulation block", () => {
    const html = renderToString(<HomePage />);
    expect(html).toContain("Déclarer mon trajet");
    expect(html).toContain("Simulation corridor");
  });
});
