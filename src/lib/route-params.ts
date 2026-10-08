export const MAX_ROUTE_ID_LENGTH = 128;
export const MAX_HOSTEL_ROUTE_PARAM_LENGTH = 200;

export function isBoundedRouteParam(value: string, maxLength = MAX_ROUTE_ID_LENGTH): boolean {
  return value.length > 0 && value.length <= maxLength;
}
