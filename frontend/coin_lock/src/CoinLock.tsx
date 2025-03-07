import { useSuiClientQuery, useSuiClientQueries } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Button, Flex, Table } from "@radix-ui/themes";
import { useCallback } from "react";
import { toast } from "sonner";

import { COIN_LOCK_OBJECT_TYPE } from "./constants";
import useSuiTx from "./hooks/useSuiTx";
import useSuiAccount from "./hooks/useSuiAccount";
import { MOVECALL_TARGET_WITHDRAW_COIN } from "./constants";
import LockCoinButton from "./LockCoinButton";
import { formatSuiBalance } from "./utils";

export default function CoinLock() {
  const { account, totalBalance } = useSuiAccount();
  const { signExecuteAndWaitForTx } = useSuiTx();

  const {
    data: coinLocks,
    isPending: isCoinLocksPending,
    error: coinLocksError,
    refetch: refetchCoinLocks,
  } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: {
        MatchAll: [
          {
            StructType: COIN_LOCK_OBJECT_TYPE,
          },
        ],
      },
      options: {
        showContent: true,
      },
    },
    {
      enabled: !!account,
    },
  );

  const { data: notesData, isPending: isNotesDataPending } =
    useSuiClientQueries({
      queries: (
        coinLocks?.data?.map((obj) => obj.data?.objectId).filter(Boolean) || []
      ).map((objectId) => {
        return {
          method: "getDynamicFieldObject",
          params: {
            parentId: objectId as string,
            name: {
              // these are the bytes for the 'note' key
              type: "vector<u8>",
              value: [110, 111, 116, 101],
            },
          },
        };
      }),
      combine: (results) => ({
        data: results.map(
          (result) => (result.data?.data?.content as any)?.fields.value,
        ),
        isSuccess: results.every((result) => result.isSuccess),
        isPending: results.some((result) => result.isPending),
      }),
    });

  const withdrawCoin = useCallback(
    async (coinLockObjectId: string) => {
      if (!account) throw new Error("Wallet not connected");

      const tx = new Transaction();

      tx.moveCall({
        target: MOVECALL_TARGET_WITHDRAW_COIN,
        arguments: [
          tx.object(coinLockObjectId),
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
    },
    [account, signExecuteAndWaitForTx],
  );

  if (!account) return;

  if (coinLocksError) return <Flex>Error: {coinLocksError.message}</Flex>;

  if (isCoinLocksPending || isNotesDataPending || !coinLocks)
    return <Flex>Loading...</Flex>;

  return (
    <Flex direction="column" gap="4">
      <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
        Balance: {formatSuiBalance(totalBalance)} SUI
      </div>

      <div>
        <LockCoinButton refetchCoinLocks={refetchCoinLocks} />
      </div>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Start Time</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>End Time</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Note</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell />
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {coinLocks.data.map((coinLock, index) => {
            const objectId = coinLock.data?.objectId as string;
            const {
              balance,
              duration: durationMs,
              time_created,
            } = (coinLock.data?.content as any)?.fields;
            const [start, duration, end, hasEnded] = formatTimeRange(
              +time_created,
              +durationMs,
            );

            return (
              <Table.Row>
                <Table.Cell>{formatSuiBalance(balance, 4)} SUI</Table.Cell>
                <Table.Cell>{start}</Table.Cell>
                <Table.Cell>{duration}</Table.Cell>
                <Table.Cell>{end}</Table.Cell>
                <Table.Cell>
                  {/* Date in Notes Data follow the same order as coinLocks */}
                  {isNotesDataPending ? "" : notesData[index] || "N/A"}
                </Table.Cell>
                <Table.Cell>
                  {hasEnded && (
                    <Button onClick={() => withdrawCoin(objectId)}>
                      Withdraw
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}

function formatTimeRange(
  startTimeMs: number,
  durationMs: number,
): [string, string, string, boolean] {
  // Create Date objects for start and end times
  const startDate = new Date(startTimeMs);
  const endDate = new Date(startTimeMs + durationMs);
  const currentDate = new Date();

  // Format options for date and time
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  // Format start and end times
  const formattedStart = startDate.toLocaleString("en-US", formatOptions);
  const formattedEnd = endDate.toLocaleString("en-US", formatOptions);

  // Calculate and format duration
  const durationMinutes = Math.round(durationMs / 60000); // Convert ms to minutes
  let durationText: string;

  if (durationMinutes < 60) {
    // Less than 1 hour - show minutes
    durationText = `${durationMinutes} minute${durationMinutes === 1 ? "" : "s"}`;
  } else if (durationMinutes < 1440) {
    // Less than 1 day - show hours
    const hours = Math.round(durationMinutes / 60);
    durationText = `${hours} hour${hours === 1 ? "" : "s"}`;
  } else {
    // 1 day or more - show days
    const days = Math.round(durationMinutes / 1440);
    durationText = `${days} day${days === 1 ? "" : "s"}`;
  }

  // Check if the event has ended
  const hasEnded = currentDate > endDate;

  return [formattedStart, durationText, formattedEnd, hasEnded];
}
