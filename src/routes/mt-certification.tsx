import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonDashboard } from "@/components/dashboard/coming-soon";

export const Route = createFileRoute("/mt-certification")({
  head: () => ({ meta: [{ title: "MT Certification · Zilla Analytics" }] }),
  component: () => (
    <ComingSoonDashboard
      title="Master Trainer Certification"
      description="Operational visibility into the Master Trainer certification process — certification progress across geographies and departments, and the certification status of individual Master Trainers."
    />
  ),
});
