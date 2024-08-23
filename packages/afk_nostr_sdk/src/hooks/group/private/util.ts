export function objectToTagArray(obj: {[key: string]: any}): [string, string][] {
  return Object.entries(obj);
}
