import React, { createContext, useContext, useState, useEffect } from "react";
import { SubmissionState, SubmissionStatus } from "@/types/submission";
import { showToast } from "@/lib/toast";
import api from "@/lib/api";

interface SubmissionContextType {
  submissionState: SubmissionState | null;
  isSubmitting: boolean;
  isLoading: boolean;
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
  const [submissionState, setSubmissionState] =
    useState<SubmissionState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubmissionState = async () => {
    try {
      const response = await api.get(`/templates/${templateCode}/submission/`);
      if (response.data.status === "success") {
        setSubmissionState(response.data.data);
      } else {
        setSubmissionState(null);
      }
    } catch (error: any) {
      console.error("Failed to fetch submission state:", error);
      showToast.error(
        error.response?.data?.message || "Failed to fetch submission status"
      );
      setSubmissionState(null);
    }
  };

  // Initial fetch of submission state
  useEffect(() => {
    const fetchInitialState = async () => {
      setIsLoading(true);
      await refreshSubmissionState();
      setIsLoading(false);
    };

    fetchInitialState();
  }, [templateCode]);

  const submitTemplate = async () => {
    if (
      !submissionState?.id &&
      submissionState?.status !== "draft" &&
      submissionState?.status !== "rejected"
    ) {
      showToast.error("Invalid submission state for submitting");
      return;
    }

    const loadingToast = showToast.loading("Submitting template data...");
    setIsSubmitting(true);

    try {
      const response = await api.post(`/templates/${templateCode}/submit/`);

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Template submitted successfully");
        setSubmissionState(response.data.data);
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
    if (submissionState?.status !== "submitted") {
      showToast.error("Can only withdraw submitted templates");
      return;
    }

    const loadingToast = showToast.loading("Withdrawing submission...");
    setIsSubmitting(true);

    try {
      const response = await api.post(`/templates/${templateCode}/withdraw/`);

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Submission withdrawn successfully");
        setSubmissionState(response.data.data);
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

  // Add periodic refresh for submitted status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (submissionState?.status === "submitted") {
      intervalId = setInterval(refreshSubmissionState, 30000); // Check every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [submissionState?.status]);

  return (
    <SubmissionContext.Provider
      value={{
        submissionState,
        isSubmitting,
        isLoading,
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
