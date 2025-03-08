import { SUI_DECIMALS } from "@mysten/sui/utils";
import { BigNumber } from "bignumber.js";

/**
 * Formats a SUI balance in mist to a string with specified decimal places,
 * removing unnecessary trailing zeros.
 * E.g. 1000000000 -> "1"
 * E.g. 1234500000 -> "1.2345"
 * E.g. 1234567890 -> "1.23456789"
 * 
 * @param balanceInMist - The balance in mist to format.
 * @param toFixed - The maximum number of decimal places (optional).
 * @returns The formatted balance as a string without unnecessary trailing zeros.
 */
export function formatSuiBalance(
  balanceInMist: string | BigNumber,
  toFixed?: number,
): string {
  const value = new BigNumber(balanceInMist)
    .div(10 ** SUI_DECIMALS)
    .toFixed(toFixed ?? SUI_DECIMALS);
  
  // Remove trailing zeros and decimal point if it's just an integer
  return value.replace(/\.?0+$/, '');
}