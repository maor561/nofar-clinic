"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/core/design-system";
import {
  documentKind,
  documentVisibility,
  DOCUMENT_KIND_LABEL,
  DOCUMENT_VISIBILITY_LABEL,
} from "@/modules/documents/labels";
import { ALLOWED_MIME } from "@/modules/core/files/labels";
import type { DocFormState } from "./actions";

export function UploadForm({
  action,
  showVisibility = false,
}: {
  action: (prev: DocFormState, fd: FormData) => Promise<DocFormState>;
  showVisibility?: boolean;
}) {
  const [state, formAction, pending] = useActionState<DocFormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!pending && !state.error) {
      ref.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="border-line bg-surface-2 grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto]"
    >
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="file">קובץ</Label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept={ALLOWED_MIME.join(",")}
            className="text-ink-soft file:bg-sage-soft file:text-sage-deep text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold"
          />
          <span className="text-ink-faint text-[11px]">PDF, תמונות, Word, טקסט — עד 15MB</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="kind">סוג</Label>
            <Select name="kind" defaultValue="other">
              <SelectTrigger id="kind" className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentKind.map((k) => (
                  <SelectItem key={k} value={k}>
                    {DOCUMENT_KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showVisibility && (
            <div className="grid gap-1.5">
              <Label htmlFor="visibility">נראות</Label>
              <Select name="visibility" defaultValue="therapist_only">
                <SelectTrigger id="visibility" className="min-w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentVisibility.map((v) => (
                    <SelectItem key={v} value={v}>
                      {DOCUMENT_VISIBILITY_LABEL[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {state.error && (
          <p role="alert" className="text-danger text-[13px]">
            {state.error}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? "מעלה…" : "העלאה"}
      </Button>
    </form>
  );
}
