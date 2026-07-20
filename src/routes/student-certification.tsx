import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonDashboard } from "@/components/dashboard/coming-soon";

export const Route = createFileRoute("/student-certification")({
  head: () => ({ meta: [{ title: "Student Certification · Zilla Analytics" }] }),
  component: () => (
    <ComingSoonDashboard
      title="Student Certification"
      description="Operational visibility into Field Staff certification during Deployment Rollout — certification progress across geographies, departments, and individual participants."
    />
  ),
});
