import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PAYROLL_DISTRIBUTOR_ADDRESS, PAYROLL_DISTRIBUTOR_ABI } from '@/contracts';
import { parseEther } from 'viem';

/**
 * usePayroll Hook
 * Encapsulates logic for interacting with the PayrollDistributor smart contract.
 */
export function usePayroll() {
    const {
        data: hash,
        writeContract,
        isPending: isWritePending,
        error: writeError
    } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: receiptError
    } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * batchPay
     * Executes a batch payment transaction.
     * @param targets Array of recipient addresses
     * @param values Array of amounts in ETH/USDC (as string, e.g. "1.5")
     * @param datas Array of calldata bytes (optional, defaults to empty)
     */
    const batchPay = (targets: string[], values: string[], datas: string[] = [], valueOverride?: bigint) => {
        if (targets.length !== values.length) {
            throw new Error("Mismatch between targets and values length.");
        }

        // Default empty bytes if not provided
        const payloadDatas = datas.length === targets.length
            ? datas
            : new Array(targets.length).fill("0x");

        // Convert string values to Wei (18 decimals)
        const weiValues = values.map(val => parseEther(val));

        // Calculate total msg.value needed
        // Use override if provided (for CCTP which sends 0-value ops but needs contract funding)
        // Otherwise default to sum of values
        const totalValue = valueOverride !== undefined
            ? valueOverride
            : weiValues.reduce((acc, val) => acc + val, 0n);

        writeContract({
            address: PAYROLL_DISTRIBUTOR_ADDRESS,
            abi: PAYROLL_DISTRIBUTOR_ABI,
            functionName: 'batchPay',
            args: [targets as `0x${string}`[], payloadDatas as `0x${string}`[], weiValues],
            value: totalValue,
        });
    };

    return {
        batchPay,
        isWritePending,
        isConfirming,
        isConfirmed,
        hash,
        error: writeError || receiptError,
    };
}
