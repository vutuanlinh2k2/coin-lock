import { SUI_DECIMALS } from "@mysten/sui/utils";
import { BigNumber } from "bignumber.js";

export function formatSuiBalance(
  balanceInMist: string | BigNumber,
  toFixed?: number,
): string {
  return new BigNumber(balanceInMist)
    .div(10 ** SUI_DECIMALS)
    .toFixed(toFixed ?? SUI_DECIMALS);
}
