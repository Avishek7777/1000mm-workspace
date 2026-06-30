"use client";

import { useActionState, useEffect, useRef } from "react";
import { deleteFinancialEntry } from "@/actions/financial";
import type { ActionResult } from "@/actions/financial";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const bound = deleteFinancialEntry.bind(null, entryId);
  const [state, action, pending] = useActionState<ActionResult, FormData>(bound, { ok: false });

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => { if (!confirm("Delete this entry?")) e.preventDefault(); }}
        className="text-[11px] text-red-500 hover:text-red-700 disabled:opacity-40"
      >
        Delete
      </button>
    </form>
  );
}
