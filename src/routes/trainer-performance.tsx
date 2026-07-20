import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonDashboard } from "@/components/dashboard/coming-soon";

export const Route = createFileRoute("/trainer-performance")({
  head: () => ({ meta: [{ title: "Trainer Performance · Zilla Analytics" }] }),
  component: () => (
    <ComingSoonDashboard
      title="Trainer Performance"
      description="Performance and utilization of Master Trainers during Deployment Rollout — top performers, performance distribution, individual trainer profiles, and batch history drill-down."
    />
  ),
});
