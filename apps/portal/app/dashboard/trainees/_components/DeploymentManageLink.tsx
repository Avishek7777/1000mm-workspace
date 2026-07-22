import Link from "next/link";

// Field location is set only through the deployment request/approval
// workflow (MissionaryDeployment) — this just links there instead of
// offering an independent edit form, so there's a single place it can
// change and everywhere else (this page included) stays in sync.
export function DeploymentManageLink({ isLmd }: { isLmd: boolean }) {
  return (
    <Link
      href={isLmd ? "/dashboard/lmd/deployments" : "/dashboard/director/deployments"}
      className="rounded border border-teal-300 bg-white px-2 py-0.5 text-[10px] font-medium text-teal-700 hover:bg-teal-50 transition-colors"
    >
      Manage
    </Link>
  );
}
