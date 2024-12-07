// context/submission-context

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { SubmissionState } from "@/types/submission";
import { showToast } from "@/lib/toast";
import { templateServices, templateSubmissionServices } from "@/services/core";

interface SubmissionContextType {
  submissionState: SubmissionState | null;
  isSubmitting: boolean;
  isLoading: boolean;
  submitTemplate: () => Promise<void>;
  withdrawSubmission: () => Promise<void>;
  refreshSubmissionState: () => Promise<void>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(
  undefined
);

const REFRESH_INTERVALS: Record<SubmissionState["status"], number | null> = {
  draft: 60000, // Every 1 minute
  submitted: 30000, // Every 30 seconds
  approved: null, // No refresh needed
  rejected: null, // No refresh needed
};

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const refreshSubmissionState = useCallback(
    async (showLoadingState = false) => {
      try {
        if (showLoadingState) setIsLoading(true);

        const response = await templateServices.fetchSubmissions(templateCode);
        console.log("subs", response);

        if (response.status === "success") {
          const newState = response.data;
          setSubmissionState((prevState) => {
            // Only update if the state has actually changed
            if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
              setLastUpdateTime(new Date());
              return newState;
            }
            return prevState;
          });
        } else {
          setSubmissionState(null);
        }
      } catch (error: any) {
        console.error("Failed to fetch submission state:", error);
        if (error.response?.status !== 404) {
          // Don't show error for 404
          showToast.error(
            error.response?.data?.message || "Failed to fetch submission status"
          );
        }
        setSubmissionState(null);
      } finally {
        if (showLoadingState) setIsLoading(false);
      }
    },
    [templateCode]
  );

  // Initial fetch of submission state
  useEffect(() => {
    refreshSubmissionState(true);
  }, [templateCode]);

  // Setup automatic refresh based on submission status
  useEffect(() => {
    const status = submissionState?.status || "draft";
    const interval = REFRESH_INTERVALS[status];

    if (!interval) return;

    const intervalId = setInterval(() => {
      // Only refresh if the page is visible
      if (!document.hidden) {
        refreshSubmissionState(false);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [submissionState?.status, refreshSubmissionState]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSubmissionState(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSubmissionState]);

  // Handle beforeunload event when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const submitTemplate = async () => {
    if (hasUnsavedChanges) {
      showToast.error("Please save all changes before submitting");
      return;
    }

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
      const response = await templateSubmissionServices.submitTemplate(
        templateCode
      );
      if (response.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Template submitted successfully");
        setSubmissionState(response.data);
        setHasUnsavedChanges(false);
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
      const response = await templateSubmissionServices.withdrawSubmission(
        templateCode
      );
      console.log("response", response);
      if (response.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Submission withdrawn successfully");
        setSubmissionState(response.data);
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

  // Show last update time in console for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Submission state last updated:",
        lastUpdateTime.toISOString()
      );
    }
  }, [lastUpdateTime]);

  return (
    <SubmissionContext.Provider
      value={{
        submissionState,
        isSubmitting,
        isLoading,
        submitTemplate,
        withdrawSubmission,
        refreshSubmissionState,
        hasUnsavedChanges,
        setHasUnsavedChanges,
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
