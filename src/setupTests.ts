import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without globals, so Testing Library cannot unmount on its own.
// Unmount after every test so the next one starts from an empty page.
afterEach(cleanup);
