import { defineConfig } from "vitest/config";

/**
 * Kept separate from vite.config.ts on purpose: the PWA plugin generates a
 * service worker and has no business running during a unit test.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
