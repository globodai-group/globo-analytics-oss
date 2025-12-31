"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ActionResult } from "@/lib/types/actions";

interface UseAsyncActionOptions<T> {
  /**
   * Show success toast on completion
   */
  showSuccessToast?: boolean;
  /**
   * Show error toast on failure
   */
  showErrorToast?: boolean;
  /**
   * Custom success message (overrides action result message)
   */
  successMessage?: string;
  /**
   * Custom error message (overrides action result error)
   */
  errorMessage?: string;
  /**
   * Callback on successful action
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback on failed action
   */
  onError?: (error: string) => void;
  /**
   * Callback when action completes (success or failure)
   */
  onSettled?: () => void;
}

interface UseAsyncActionReturn<TArgs extends unknown[], TResult> {
  /**
   * Execute the action
   */
  execute: (...args: TArgs) => Promise<ActionResult<TResult>>;
  /**
   * Whether the action is currently running
   */
  isLoading: boolean;
  /**
   * The last error message
   */
  error: string | null;
  /**
   * Reset the error state
   */
  reset: () => void;
}

/**
 * Hook for executing async server actions with loading state and error handling
 *
 * @example
 * const { execute, isLoading } = useAsyncAction(
 *   deleteGoalAction,
 *   { showSuccessToast: true, onSuccess: () => router.refresh() }
 * );
 *
 * <Button onClick={() => execute(goalId, locale)} disabled={isLoading}>
 *   {isLoading ? "Deleting..." : "Delete"}
 * </Button>
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<ActionResult<TResult>>,
  options: UseAsyncActionOptions<TResult> = {},
): UseAsyncActionReturn<TArgs, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    onSettled,
  } = options;

  const execute = useCallback(
    async (...args: TArgs): Promise<ActionResult<TResult>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(...args);

        if (result.success) {
          if (showSuccessToast && (result.message || successMessage)) {
            toast.success(successMessage || result.message);
          }
          if (onSuccess && result.data !== undefined) {
            onSuccess(result.data);
          }
        } else {
          const errMsg = errorMessage || result.error;
          setError(errMsg);
          if (showErrorToast) {
            toast.error(errMsg);
          }
          if (onError) {
            onError(errMsg);
          }
        }

        return result;
      } catch (err) {
        const errMsg =
          errorMessage ||
          (err instanceof Error ? err.message : "An error occurred");
        setError(errMsg);
        if (showErrorToast) {
          toast.error(errMsg);
        }
        if (onError) {
          onError(errMsg);
        }
        return { success: false, error: errMsg } as ActionResult<TResult>;
      } finally {
        setIsLoading(false);
        if (onSettled) {
          onSettled();
        }
      }
    },
    [
      action,
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      onSettled,
    ],
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { execute, isLoading, error, reset };
}

/**
 * Variant for form submissions with FormData
 *
 * @example
 * const { execute, isLoading } = useFormAction(
 *   createProjectAction,
 *   { onSuccess: (data) => router.push(`/projects/${data.id}`) }
 * );
 *
 * const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
 *   e.preventDefault();
 *   const formData = new FormData(e.currentTarget);
 *   await execute(formData, locale);
 * };
 */
export function useFormAction<TResult>(
  action: (
    formData: FormData,
    locale: string,
  ) => Promise<ActionResult<TResult>>,
  options: UseAsyncActionOptions<TResult> = {},
) {
  return useAsyncAction(action, options);
}

/**
 * Variant for actions that don't return data (void actions)
 */
export function useVoidAction<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<ActionResult<void>>,
  options: Omit<UseAsyncActionOptions<void>, "onSuccess"> & {
    onSuccess?: () => void;
  } = {},
) {
  const modifiedOptions: UseAsyncActionOptions<void> = {
    ...options,
    onSuccess: options.onSuccess ? () => options.onSuccess?.() : undefined,
  };

  return useAsyncAction(action, modifiedOptions);
}
