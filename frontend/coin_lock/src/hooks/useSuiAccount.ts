import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import BigNumber from "bignumber.js";

export default function useSuiAccount() {
  const account = useCurrentAccount();

  const { data: balance } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    { enabled: !!account },
  );
  const totalBalance = new BigNumber(balance?.totalBalance || "0");

  return { account, totalBalance };
}
