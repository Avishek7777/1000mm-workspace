"use client";

import { useActionState } from "react";
import { deleteResource } from "@/actions/resources";
import { Trash2 } from "lucide-react";

export function DeleteResourceButton({ id }: { id: string }) {
  const [, dispatch, pending] = useActionState(deleteResource, null);

  return (
    <form
      action={dispatch}
      onSubmit={(e) => { if (!confirm("Delete this resource?")) e.preventDefault(); }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="rounded p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50" title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
