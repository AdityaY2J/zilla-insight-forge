import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonDashboard } from "@/components/dashboard/coming-soon";

export const Route = createFileRoute("/performance-insights")({
  head: () => ({ meta: [{ title: "Performance Insights · Zilla Analytics" }] }),
  component: () => (
    <ComingSoonDashboard
      title="Performance Insights"
      description="Identify operational areas requiring intervention during Deployment Rollout — underperforming geographies, trainers, and batches based on completed deployment data."
    />
  ),
});
