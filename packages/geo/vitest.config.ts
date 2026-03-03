import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "geo",
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
  },
});
