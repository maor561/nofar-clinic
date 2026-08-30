"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/modules/core/design-system";

export type ChatFormState = { error?: string; ok?: number };

/** Re-runs the server component every `ms` so new messages appear (WP-16 polling). */
export function ChatPoller({ ms = 12000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [router, ms]);
  return null;
}

export function ChatComposer({
  action,
}: {
  action: (prev: ChatFormState, fd: FormData) => Promise<ChatFormState>;
}) {
  const [state, formAction, pending] = useActionState<ChatFormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form ref={ref} action={formAction} className="border-line bg-surface flex gap-2 border-t pt-3">
      <textarea
        name="body"
        required
        rows={2}
        placeholder="כתבו הודעה…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        className="border-input flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={pending} className="self-end">
        {pending ? "שולח…" : "שליחה"}
      </Button>
      {state.error && (
        <p role="alert" className="text-danger self-center text-xs">
          {state.error}
        </p>
      )}
    </form>
  );
}
