// app/(dashboard)/iqac/submissions/[id]/page.tsx
"use client";

import { SubmissionReview } from "@/components/submissions/review/submission-review";

export default function SubmissionReviewPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Review Submission</h1>
          <p className="text-muted-foreground">
            Review and approve/reject department submission
          </p>
        </div>

        <SubmissionReview submissionId={params.id} />
      </div>
    </div>
  );
}
