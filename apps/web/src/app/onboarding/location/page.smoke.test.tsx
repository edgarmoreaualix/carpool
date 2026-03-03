import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import OnboardingLocationPage from "./page";

describe("onboarding location page", () => {
  it("renders continue action and map instructions", () => {
    const html = renderToString(<OnboardingLocationPage />);
    expect(html).toContain("Continuer");
    expect(html).toContain("Cliquez sur la carte");
  });
});
