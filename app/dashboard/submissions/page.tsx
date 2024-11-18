import { SubmissionList } from "@/components/submissions/submission-list";

export default function IQACSubmissionsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Review Submissions</h1>
          <p className="text-muted-foreground">
            Review and approve/reject department submissions
          </p>
        </div>

        <SubmissionList />
      </div>
    </div>
  );
}
