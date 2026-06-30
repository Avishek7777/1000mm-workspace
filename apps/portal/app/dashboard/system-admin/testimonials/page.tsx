import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { TestimonyCard } from "./_components/TestimonyCard";
import { AddTestimonyButton } from "./_components/AddTestimonyButton";

export default async function TestimonialsAdminPage() {
  await requireRole(["SYSTEM_ADMIN"]);

  const testimonies = await prisma.testimony.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Testimonies</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {testimonies.length} testimon{testimonies.length !== 1 ? "ies" : "y"} ·
            displayed on the public website homepage
          </p>
        </div>
        <AddTestimonyButton />
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        Testimonies are shown in order (lowest number first). Use the order field to control the display sequence.
        Only published testimonies appear on the website.
      </div>

      {testimonies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No testimonies yet. Add the first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {testimonies.map((t) => (
            <TestimonyCard key={t.id} testimony={t} />
          ))}
        </div>
      )}
    </div>
  );
}
