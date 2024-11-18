import React, { createContext, useContext, useState } from "react";
import { SubmissionState, SubmissionStatus } from "@/types/submission";
import { showToast } from "@/lib/toast";
import api from "@/lib/api";

interface SubmissionContextType {
  submissionState: SubmissionState;
  isSubmitting: boolean;
  submitTemplate: () => Promise<void>;
  withdrawSubmission: () => Promise<void>;
  refreshSubmissionState: () => Promise<void>;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(
  undefined
);

export function SubmissionProvider({
  children,
  templateCode,
}: {
  children: React.ReactNode;
  templateCode: string;
}) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    id: null,
    status: "draft",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshSubmissionState = async () => {
    try {
      const response = await api.get(`/templates/${templateCode}/submission/`);
      if (response.data.status === "success") {
        setSubmissionState(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch submission state:", error);
    }
  };

  const submitTemplate = async () => {
    const loadingToast = showToast.loading("Submitting template data...");
    setIsSubmitting(true);
    try {
      const response = await api.post(`/templates/${templateCode}/submit/`);
      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Template submitted successfully");
        await refreshSubmissionState();
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(
        error.response?.data?.message || "Failed to submit template"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const withdrawSubmission = async () => {
    const loadingToast = showToast.loading("Withdrawing submission...");
    setIsSubmitting(true);
    try {
      const response = await api.post(`/templates/${templateCode}/withdraw/`);
      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Submission withdrawn successfully");
        await refreshSubmissionState();
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(
        error.response?.data?.message || "Failed to withdraw submission"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SubmissionContext.Provider
      value={{
        submissionState,
        isSubmitting,
        submitTemplate,
        withdrawSubmission,
        refreshSubmissionState,
      }}
    >
      {children}
    </SubmissionContext.Provider>
  );
}

export const useSubmission = () => {
  const context = useContext(SubmissionContext);
  if (context === undefined) {
    throw new Error("useSubmission must be used within a SubmissionProvider");
  }
  return context;
};
