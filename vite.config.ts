import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Under WSL, a project on the Windows drive (/mnt/c/...) gets no file-change events for
// edits made from Windows, so the dev server would keep serving stale modules. Poll there.
const runningInWsl = process.env.WSL_DISTRO_NAME !== undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    watch: runningInWsl ? { usePolling: true, interval: 300 } : undefined,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
  },
});
