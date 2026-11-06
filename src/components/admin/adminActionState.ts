export function isUncertainAdminActionStatus(status: number): boolean {
  return status >= 500;
}
