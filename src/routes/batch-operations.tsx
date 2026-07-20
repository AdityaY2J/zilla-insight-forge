import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonDashboard } from "@/components/dashboard/coming-soon";

export const Route = createFileRoute("/batch-operations")({
  head: () => ({ meta: [{ title: "Batch Operations · Zilla Analytics" }] }),
  component: () => (
    <ComingSoonDashboard
      title="Batch Operations"
      description="Operational visibility into all training batches conducted across the program. A single reusable dashboard for both Capacity Building and Deployment Rollout batches — content is controlled by the Batch Type filter."
    />
  ),
});
