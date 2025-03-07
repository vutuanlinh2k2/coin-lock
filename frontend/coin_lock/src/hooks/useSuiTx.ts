import { useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback } from "react";

export default function useSuiTx() {
  const suiClient = useSuiClient();

  const { mutateAsync: signTransaction } = useSignTransaction();

  const signExecuteAndWaitForTx = useCallback(
    async (tx: Transaction) => {
      const signedTx = await signTransaction({
        transaction: tx,
        chain: "sui:testnet", // only support testnet
      });

      // Execute
      const res1 = await suiClient.executeTransactionBlock({
        transactionBlock: signedTx.bytes,
        signature: signedTx.signature,
      });

      // Wait
      const res2 = await suiClient.waitForTransaction({
        digest: res1.digest,
        options: {
          showBalanceChanges: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      if (
        res2.effects?.status !== undefined &&
        res2.effects.status.status === "failure"
      ) {
        throw new Error(res2.effects.status.error ?? "Transaction failed");
      }

      return res2;
    },
    [suiClient, signTransaction],
  );

  return { signExecuteAndWaitForTx };
}
