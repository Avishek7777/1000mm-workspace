/**
 * Skeleton dashboard
 *
 * The first page that requires authentication. Proves the whole loop:
 * sign-in → JWT issued → middleware accepts → page reads session →
 * displays user identity.
 *
 * This will be replaced by a real role-specific dashboard in a later
 * session. For now it's a "hello, you" page.
 */

import { requireAuth } from "@/lib/auth/helpers";
import { logoutAction } from "@/lib/auth/actions";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="mx-auto max-w-3xl py-12 px-6">
      <header className="flex items-center justify-between mb-12">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="rounded border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-4">Signed in</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-gray-600">Name</dt>
          <dd>{user.name}</dd>
          <dt className="text-gray-600">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-gray-600">Role</dt>
          <dd>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
              {user.role}
            </span>
          </dd>
          <dt className="text-gray-600">Local Mission</dt>
          <dd>{user.homeMissionCode}</dd>
        </dl>
      </section>

      <p className="mt-8 text-sm text-gray-600">
        This is a skeleton. Role-specific dashboards come in a later session.
      </p>
    </div>
  );
}