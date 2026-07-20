import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonDashboard } from "@/components/dashboard/coming-soon";

export const Route = createFileRoute("/deployment-readiness")({
  head: () => ({ meta: [{ title: "Deployment Readiness · Zilla Analytics" }] }),
  component: () => (
    <ComingSoonDashboard
      title="Deployment Readiness"
      description="Determine whether each geography is fully prepared to begin Deployment Rollout — batch planning, venue confirmation, and taluka-level readiness status."
    />
  ),
});
