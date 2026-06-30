"use client";

import { useActionState } from "react";
import { deleteAssignment } from "@/actions/assignments";
import { Trash2 } from "lucide-react";

export function DeleteAssignmentButton({ id }: { id: string }) {
  const [, dispatch, pending] = useActionState(deleteAssignment, null);

  return (
    <form
      action={dispatch}
      onSubmit={(e) => {
        if (!confirm("Delete this assignment? Trainee submissions will remain.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        title="Delete assignment"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
