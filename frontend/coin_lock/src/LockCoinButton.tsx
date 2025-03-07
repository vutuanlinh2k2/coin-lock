import { useSuiClient } from "@mysten/dapp-kit";
import { useCallback, useMemo, useState } from "react";
import { Button, Dialog, Flex, Select } from "@radix-ui/themes";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, SUI_DECIMALS } from "@mysten/sui/utils";
import { toast } from "sonner";
import { BigNumber } from "bignumber.js";

import useSuiTx from "./hooks/useSuiTx";
import useSuiAccount from "./hooks/useSuiAccount";
import { MOVECALL_TARGET_LOCK_COIN } from "./constants";
import { formatSuiBalance } from "./utils";

export default function LockCoinButton({
  refetchCoinLocks,
}: {
  refetchCoinLocks: () => void;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button color="green">Lock Coin</Button>
      </Dialog.Trigger>

      <LockCoinDialogContent refetchCoinLocks={refetchCoinLocks} />
    </Dialog.Root>
  );
}

function LockCoinDialogContent({
  refetchCoinLocks,
}: {
  refetchCoinLocks: () => void;
}) {
  const client = useSuiClient();
  const { account, totalBalance } = useSuiAccount();
  const { signExecuteAndWaitForTx } = useSuiTx();

  const [amount, setAmount] = useState<string>("");
  const [duration, setDuration] = useState("30mins");
  const [note, setNote] = useState<string>("");

  const lockAmountInMist = useMemo(
    () => new BigNumber(+amount * 10 ** SUI_DECIMALS),
    [amount],
  );
  const isInsufficient = useMemo(
    () => lockAmountInMist.gte(totalBalance),
    [lockAmountInMist, totalBalance],
  );

  const durationInMs = useMemo(() => {
    switch (duration) {
      case "30mins":
        return 30 * 60 * 1000;
      case "1hr":
        return 60 * 60 * 1000;
      case "2hrs":
        return 2 * 60 * 60 * 1000;
      case "4hrs":
        return 4 * 60 * 60 * 1000;
      case "6hrs":
        return 6 * 60 * 60 * 1000;
      case "12hrs":
        return 12 * 60 * 60 * 1000;
      case "1day":
        return 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }, [duration]);

  const lockCoin = useCallback(async () => {
    if (!account) throw new Error("Wallet not connected");
    if (!amount) throw new Error("Amount is required");
    if (isInsufficient) throw new Error("Insufficient balance");

    const tx = new Transaction();

    const { data: coinObjects } = await client.getAllCoins({
      owner: account.address,
    });

    if (!coinObjects.length) {
      throw new Error("No SUI coins found for the user");
    }

    // Sum balances until we exceed amountToLock
    let cumulativeBalance = new BigNumber(0);
    let mergeCoins: string[] = [];
    let i = 0;
    while (i < coinObjects.length && cumulativeBalance.lt(lockAmountInMist)) {
      cumulativeBalance = cumulativeBalance.plus(
        new BigNumber(coinObjects[i].balance),
      );
      mergeCoins.push(coinObjects[i].coinObjectId);
      i++;
    }

    // Merge coins if necessary
    let primaryCoin: string;
    if (mergeCoins.length > 1) {
      primaryCoin = mergeCoins[0];
      tx.mergeCoins(
        tx.object(primaryCoin),
        mergeCoins.slice(1).map((id) => tx.object(id)),
      );
    } else {
      primaryCoin = mergeCoins[0];
    }

    // Split the primary coin into the amount to lock
    const [splitCoin] = tx.splitCoins(tx.object(primaryCoin), [
      tx.pure.u64(lockAmountInMist.toNumber()),
    ]);

    tx.moveCall({
      target: MOVECALL_TARGET_LOCK_COIN,
      arguments: [
        tx.object(splitCoin),
        tx.pure.u64(durationInMs),
        tx.pure.option("string", note ?? null),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    try {
      await signExecuteAndWaitForTx(tx);

      toast.success("Coin withdrawn successfully");

      refetchCoinLocks();
    } catch (err) {
      toast.error("Failed to withdraw coin", {
        description: (err as Error)?.message || "An unknown error occurred",
      });
    }
  }, [
    account,
    signExecuteAndWaitForTx,
    amount,
    note,
    isInsufficient,
    lockAmountInMist,
    durationInMs,
  ]);

  return (
    <Dialog.Content>
      <Dialog.Title>Lock Coin</Dialog.Title>
      <Dialog.Description>
        Lock your coin for a specific duration
      </Dialog.Description>

      <Flex direction="column" gap="4" mt="4">
        {/* Amount */}
        <input
          type="number"
          placeholder={`Max: ${formatSuiBalance(totalBalance)}`}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* Duration */}
        <Select.Root value={duration} onValueChange={setDuration}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="30mins">30 minutes</Select.Item>
            <Select.Item value="1hr">1 hour</Select.Item>
            <Select.Item value="2hrs">2 hours</Select.Item>
            <Select.Item value="4hrs">4 hours</Select.Item>
            <Select.Item value="6hrs">6 hours</Select.Item>
            <Select.Item value="12hrs">12 hours</Select.Item>
            <Select.Item value="1day">1 day</Select.Item>
          </Select.Content>
        </Select.Root>

        {/* Note (optional) */}
        <input
          type="text"
          placeholder="Note (optional)"
          onChange={(e) => setNote(e.target.value)}
        />
      </Flex>

      {/* Buttons for actions */}
      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray">
            Cancel
          </Button>
        </Dialog.Close>
        <Dialog.Close>
          <Button
            color="green"
            disabled={!amount || !duration || !account || isInsufficient}
            onClick={lockCoin}
          >
            Lock
          </Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  );
}
