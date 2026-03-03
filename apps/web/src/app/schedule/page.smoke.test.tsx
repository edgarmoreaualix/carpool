import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import ScheduleDemoPage from "./page";

describe("schedule page", () => {
  it("renders schedule input content", () => {
    const html = renderToString(<ScheduleDemoPage />);
    expect(html).toContain("planning");
  });
});
