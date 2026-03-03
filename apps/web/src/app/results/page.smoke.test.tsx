import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import ResultsPage from "./page";

describe("results page", () => {
  it("renders initial loading state safely", () => {
    const html = renderToString(<ResultsPage />);
    expect(html).toContain("Chargement");
  });
});
