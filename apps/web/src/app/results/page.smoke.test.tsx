import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import ResultsPage from "./page";

describe("results page", () => {
  it("renders key french labels", () => {
    const html = renderToString(<ResultsPage />);
    expect(html).toContain("Votre groupe de la semaine");
    expect(html).toContain("Résumé hebdomadaire");
  });
});
