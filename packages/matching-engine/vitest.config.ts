import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "matching-engine",
    environment: "node",
    include: ["src/**/*.test.ts", "__tests__/**/*.test.ts"],
  },
});
