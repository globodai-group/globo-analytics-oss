/**
 * Unified Action Result Types
 *
 * Centralized type definitions for all Server Actions.
 * This eliminates 20+ duplicate ActionResult definitions across the codebase.
 *
 * Usage:
 * ```ts
 * import { ActionResult, ActionSuccess, ActionError } from "@/lib/types/actions";
 *
 * async function myAction(): Promise<ActionResult<MyData>> {
 *   if (error) return ActionError("Something went wrong");
 *   return ActionSuccess({ id: 1, name: "test" });
 * }
 * ```
 */

/**
 * Standard action result type for all Server Actions
 *
 * @template T - The type of data returned on success (defaults to void)
 */
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string; error?: never }
  | { success: false; error: string; message?: never; data?: never };

/**
 * Create a success result
 */
export function ActionSuccess<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

/**
 * Create a success result without data
 */
export function ActionSuccessVoid(message?: string): ActionResult<void> {
  return { success: true, data: undefined as void, message };
}

/**
 * Create an error result
 */
export function ActionError(error: string): ActionResult<never> {
  return { success: false, error };
}

/**
 * Type guard to check if result is successful
 */
export function isActionSuccess<T>(
  result: ActionResult<T>,
): result is { success: true; data: T; message?: string } {
  return result.success === true;
}

/**
 * Type guard to check if result is an error
 */
export function isActionError<T>(
  result: ActionResult<T>,
): result is { success: false; error: string } {
  return result.success === false;
}

/**
 * Wrap an async function with error handling
 * Catches exceptions and converts them to ActionError
 */
export async function withActionErrorHandling<T>(
  fn: () => Promise<ActionResult<T>>,
  errorMessage: string = "An error occurred",
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    return ActionError(errorMessage);
  }
}

/**
 * Common error messages (i18n-ready)
 */
export const ActionErrors = {
  unauthorized: (locale: string) =>
    locale === "fr" ? "Non autorise" : "Unauthorized",
  notFound: (locale: string, resource = "Resource") =>
    locale === "fr" ? `${resource} non trouve` : `${resource} not found`,
  serverError: (locale: string) =>
    locale === "fr" ? "Erreur serveur" : "Server error",
  invalidInput: (locale: string) =>
    locale === "fr" ? "Donnees invalides" : "Invalid input",
  projectNotFound: (locale: string) =>
    locale === "fr" ? "Projet non trouve" : "Project not found",
} as const;
