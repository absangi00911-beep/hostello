/** Return a focus target only when Tab would leave the dialog's focus order. */
export function getDialogFocusBoundaryTarget<T>(
  activeElement: T | null,
  focusableElements: readonly T[],
  shiftKey: boolean,
): T | null {
  if (focusableElements.length === 0) return null;

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];
  const activeIndex = focusableElements.indexOf(activeElement as T);

  if (activeIndex === -1) return shiftKey ? last : first;
  if (shiftKey && activeIndex === 0) return last;
  if (!shiftKey && activeIndex === focusableElements.length - 1) return first;
  return null;
}
