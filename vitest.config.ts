import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/geo/vitest.config.ts", "packages/matching-engine/vitest.config.ts"],
  },
});
