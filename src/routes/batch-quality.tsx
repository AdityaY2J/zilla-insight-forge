import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonDashboard } from "@/components/dashboard/coming-soon";

export const Route = createFileRoute("/batch-quality")({
  head: () => ({ meta: [{ title: "Batch Quality · Zilla Analytics" }] }),
  component: () => (
    <ComingSoonDashboard
      title="Batch Quality"
      description="Quality and effectiveness of training batches across Capacity Building and Deployment Rollout stages. Detailed layout will be finalized after reviewing the Deployment Rollout stage requirements."
    />
  ),
});
