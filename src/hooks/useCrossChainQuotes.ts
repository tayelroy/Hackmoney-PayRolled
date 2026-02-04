import { useState } from 'react';
import { type Employee } from '@/lib/supabase';
import { parseUnits, parseEther, encodeFunctionData, parseAbi } from 'viem';
import { normalize } from 'viem/ens';
import { sepolia } from 'viem/chains';
import { usePublicClient } from 'wagmi';

// --- CCTP CONSTANTS (ARC TESTNET) ---
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const TOKEN_MESSENGER_ADDRESS = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';
const SEPOLIA_CCTP_DOMAIN = 0;

// Minimal ABIs for encoding
const USDC_ABI = parseAbi([
    'function approve(address spender, uint256 amount) returns (bool)'
]);

const MESSENGER_ABI = parseAbi([
    'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)'
]);

interface CrossChainResult {
    targets: string[];
    values: string[];
    datas: string[];
}

export function useCrossChainQuotes() {
    const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const publicClient = usePublicClient({ chainId: sepolia.id });

    const padAddressToBytes32 = (address: string) => {
        return address.replace('0x', '0x000000000000000000000000');
    };

    const fetchCrossChainRoutes = async (employees: Employee[], ownerAddress: string): Promise<CrossChainResult> => {
        setIsFetchingQuotes(true);
        setStatusMessage("Analyzing chain preferences...");

        const targets: string[] = [];
        const values: string[] = [];
        const datas: string[] = [];

        try {
            for (const emp of employees) {
                let chainId = 5042002; // Default to Arc

                try {
                    if (publicClient) {
                        const ensName = await publicClient.getEnsName({ 
                            address: emp.wallet_address as `0x${string}` 
                        });
                        
                        if (ensName) {
                            const chainRecord = await publicClient.getEnsText({ 
                                name: normalize(ensName), 
                                key: 'payroll.chain' 
                            });
                            if (chainRecord) chainId = parseInt(chainRecord);
                        }
                    }
                } catch (e) {
                    console.warn(`[CrossChain] Failed to resolve ENS for ${emp.name}`, e);
                }

                const isCrossChain = chainId !== 5042002;

                if (!isCrossChain) {
                    // Same-chain: Direct native transfer
                    console.log(`[Direct] Paying ${emp.name} on Arc: ${emp.salary} USDC`);
                    
                    targets.push(emp.wallet_address);
                    values.push(emp.salary.toString()); // Human-readable
                    datas.push("0x");
                } else {
                    // Cross-chain via CCTP
                    console.log(`[CCTP] Bridging ${emp.name} to Chain ${chainId}: ${emp.salary} USDC`);
                    setStatusMessage(`Encoding CCTP bridge for ${emp.name}...`);

                    /*
                     * KEY INSIGHT FROM ARC DOCS:
                     * "The ERC-20 function call directly affects native USDC balance movements"
                     * 
                     * This means:
                     * 1. Contract receives native USDC (18 decimals) via msg.value
                     * 2. When contract calls approve() with 6 decimals, it works on native balance
                     * 3. But we need to send ENOUGH native USDC to cover the ERC-20 amount
                     * 
                     * DECIMAL CONVERSION:
                     * - Native: 0.5 USDC = 500000000000000000 (18 decimals)
                     * - ERC-20: 0.5 USDC = 500000 (6 decimals)
                     * 
                     * The contract needs to receive the NATIVE amount, but approve/burn with ERC-20 amount
                     */

                    // Native amount to send to contract (18 decimals)
                    const nativeAmount18Dec = parseEther(emp.salary.toString());
                    
                    // ERC-20 amount for approve/burn (6 decimals)
                    const erc20Amount6Dec = parseUnits(emp.salary.toString(), 6);
                    
                    const mintRecipient = padAddressToBytes32(emp.wallet_address);

                    // Op 1: Approve TokenMessenger
                    // This needs NO native value - it operates on the contract's existing balance
                    const approveData = encodeFunctionData({
                        abi: USDC_ABI,
                        functionName: 'approve',
                        args: [TOKEN_MESSENGER_ADDRESS, erc20Amount6Dec]
                    });

                    // Op 2: DepositForBurn
                    const depositData = encodeFunctionData({
                        abi: MESSENGER_ABI,
                        functionName: 'depositForBurn',
                        args: [
                            erc20Amount6Dec,
                            SEPOLIA_CCTP_DOMAIN,
                            mintRecipient as `0x${string}`,
                            USDC_ADDRESS
                        ]
                    });

                    // CRITICAL FIX:
                    // We need to send native USDC to the contract BEFORE it can approve/burn
                    // Strategy: Send native amount with the FIRST operation (approve)
                    // This gives the contract the balance it needs
                    
                    targets.push(USDC_ADDRESS);
                    values.push(emp.salary.toString()); // THIS IS THE FIX - send native USDC here!
                    datas.push(approveData);

                    targets.push(TOKEN_MESSENGER_ADDRESS);
                    values.push('0'); // No additional native needed for depositForBurn
                    datas.push(depositData);
                }
            }

            console.log('[CrossChain] Route summary:', {
                totalOps: targets.length,
                employees: employees.length,
                targets,
                values,
                datas: datas.map(d => d.slice(0, 10) + '...')
            });

        } catch (error) {
            console.error("Error generating CCTP routes:", error);
            throw error;
        } finally {
            setIsFetchingQuotes(false);
            setStatusMessage(null);
        }

        return { targets, values, datas };
    };

    return {
        fetchCrossChainRoutes,
        isFetchingQuotes,
        statusMessage
    };
}