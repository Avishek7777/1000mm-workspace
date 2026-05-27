import Link from "next/link";

type ActionItem = {
  title: string;
  meta: string;
  href: string;
  badge?: string;
  badgeVariant?: "new" | "pending" | "urgent";
  icon: React.ReactNode;
  iconVariant: "teal" | "amber" | "blue" | "red";
};

type PendingActionsProps = {
  items: ActionItem[];
};

const iconVariantClasses: Record<ActionItem["iconVariant"], string> = {
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-700",
};

const badgeVariantClasses: Record<
  NonNullable<ActionItem["badgeVariant"]>,
  string
> = {
  new: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

export function PendingActions({ items }: PendingActionsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-medium text-gray-900">
        Pending actions
      </h2>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              className="flex items-center gap-3 py-3 hover:opacity-80 transition-opacity"
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconVariantClasses[item.iconVariant]}`}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.meta}</p>
              </div>
              {item.badge && item.badgeVariant && (
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeVariantClasses[item.badgeVariant]}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
