import { createFileRoute, redirect } from "@tanstack/react-router";

// Application navigation and entry point are intentionally not finalized yet.
// For now, land on the first defined dashboard (MT Selection).
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/mt-selection" });
  },
});
