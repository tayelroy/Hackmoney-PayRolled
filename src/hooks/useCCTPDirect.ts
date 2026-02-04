import { useState } from 'react';
import { useWriteContract, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, parseAbi, encodeFunctionData } from 'viem';
import { type Employee } from '@/lib/supabase';

// --- CCTP CONSTANTS (ARC TESTNET) ---
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const TOKEN_MESSENGER_ADDRESS = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';
const TOKEN_MINTER_ADDRESS = '0xb43db544E2c27092c107639Ad201b3dEfAbcF192';
const SEPOLIA_CCTP_DOMAIN = 0;

// ABIs
const USDC_ABI = parseAbi([
    'function approve(address spender, uint256 amount) returns (bool)'
]);

const MESSENGER_ABI = parseAbi([
    'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)'
]);

export function useCCTPDirect() {
    const { writeContractAsync } = useWriteContract();
    const [cctpStatus, setCctpStatus] = useState<string | null>(null);

    const padAddressToBytes32 = (address: string) => {
        return address.replace('0x', '0x000000000000000000000000');
    };

    const payEmployeeCCTP = async (emp: Employee) => {
        try {
            setCctpStatus(`Processing CCTP for ${emp.name}...`);

            // 1. Approve TokenMessenger (User -> Messenger)
            // Note: Since we are engaging directly as EOA, we use standard ERC20 approval.
            // Arc Docs example approves Gateway Wallet, but for CCTP we approve Messenger/Minter.
            // We'll stick to Messenger as per CCTP standard, or Minter if v2 requires it.
            // Let's try Messenger first as per standard CCTP docs unless Arc is special.
            // Wait, previous attempts failed. Arc Docs script approved 'Gateway Wallet'. 
            // BUT that was for the "Gateway" flow.
            // If we use standard CCTP, we approve Messenger.
            // I'll use Messenger (0x8FE...) based on the user's solution.md code 
            // (User wrote: args: ['0x8FE...', amount]).

            const amount6Dec = parseUnits(emp.salary.toString(), 6);

            console.log(`[CCTP Check] Approving ${amount6Dec} for Messenger...`);
            const approveHash = await writeContractAsync({
                address: USDC_ADDRESS,
                abi: USDC_ABI,
                functionName: 'approve',
                args: [TOKEN_MESSENGER_ADDRESS, amount6Dec],
            });
            console.log(`[CCTP] Approve Tx: ${approveHash}`);
            setCctpStatus(`Approved. Burning for ${emp.name}...`);

            // 2. Deposit For Burn
            const mintRecipient = padAddressToBytes32(emp.wallet_address);
            const burnHash = await writeContractAsync({
                address: TOKEN_MESSENGER_ADDRESS,
                abi: MESSENGER_ABI,
                functionName: 'depositForBurn',
                args: [
                    amount6Dec,
                    SEPOLIA_CCTP_DOMAIN,
                    mintRecipient as `0x${string}`,
                    USDC_ADDRESS
                ],
            });
            console.log(`[CCTP] Burn Tx: ${burnHash}`);
            setCctpStatus(`Sent to ${emp.name}!`);

            return burnHash;

        } catch (error) {
            console.error("CCTP Direct Error:", error);
            setCctpStatus(`Failed to pay ${emp.name}`);
            throw error;
        }
    };

    return {
        payEmployeeCCTP,
        cctpStatus
    };
}
