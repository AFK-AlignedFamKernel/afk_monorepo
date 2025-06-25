import {parseUnits, toHex} from 'viem';

export function formatToUSD(amount: any) {
  // Format the result as USD with 2 decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
export function parseUSD(usdString: string) {
  if (!usdString) {
    return '0'; // or throw an error, depending on your requirements
  }
  // Remove the currency symbol and commas, then parse to float
  const parsed = parseFloat(usdString.replace(/[$,]/g, '')).toString();
  return parsed;
}
export function parseAmountToHex(amount: string, decimals: number): string {
  const parsedUnits = parseUnits(amount, decimals);
  return toHex(parsedUnits);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
