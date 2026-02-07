import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits, maxUint256, formatUnits } from 'viem';
import { Actions, V4Planner } from '@uniswap/v4-sdk';
import { CommandType, RoutePlanner } from '@uniswap/universal-router-sdk';
import { UNISWAP_V4_BASE_SEPOLIA, ERC20_ABI } from '@/lib/uniswap-v4';

export type SwapStatus = 'idle' | 'quoting' | 'approving' | 'swapping' | 'success' | 'error';

interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    decimalsIn?: number;
    decimalsOut?: number;
}

interface QuoteResult {
    amountOut: string;
    amountOutFormatted: string;
    priceImpact: string;
}

// Contract addresses on Base Sepolia
const UNIVERSAL_ROUTER = '0x492E6456D9528771018DeB9E87ef7750EF184104';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const QUOTER = '0x4a6513c898fe1b2d0e78d3b0e0a4a151589b1cba'; // V4 Quoter on Base Sepolia

const UNIVERSAL_ROUTER_ABI = [
    {
        inputs: [
            { name: 'commands', type: 'bytes' },
            { name: 'inputs', type: 'bytes[]' },
            { name: 'deadline', type: 'uint256' },
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
] as const;

const PERMIT2_ABI = [
    {
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint160' },
            { name: 'expiration', type: 'uint48' },
        ],
        name: 'approve',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

const QUOTER_ABI = [
    {
        inputs: [
            {
                components: [
                    {
                        components: [
                            { name: 'currency0', type: 'address' },
                            { name: 'currency1', type: 'address' },
                            { name: 'fee', type: 'uint24' },
                            { name: 'tickSpacing', type: 'int24' },
                            { name: 'hooks', type: 'address' },
                        ],
                        name: 'poolKey',
                        type: 'tuple',
                    },
                    { name: 'zeroForOne', type: 'bool' },
                    { name: 'exactAmount', type: 'uint128' },
                    { name: 'hookData', type: 'bytes' },
                ],
                name: 'params',
                type: 'tuple',
            },
        ],
        name: 'quoteExactInputSingle',
        outputs: [
            { name: 'amountOut', type: 'uint256' },
            { name: 'gasEstimate', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

// Helper to build pool key
function buildPoolKey(tokenIn: string, tokenOut: string) {
    const currency0 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
    const currency1 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;
    const zeroForOne = tokenIn.toLowerCase() === currency0.toLowerCase();

    return {
        poolKey: {
            currency0: currency0 as `0x${string}`,
            currency1: currency1 as `0x${string}`,
            fee: 10000, // 1%
            tickSpacing: 200,
            hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        },
        zeroForOne,
    };
}

export function useUniswapV4Swap() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const [status, setStatus] = useState<SwapStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [quote, setQuote] = useState<QuoteResult | null>(null);

    // Get a quote for the swap
    const getQuote = async ({ tokenIn, tokenOut, amountIn, decimalsIn = 6, decimalsOut = 18 }: SwapParams): Promise<QuoteResult | null> => {
        if (!publicClient) {
            setError('Client not connected');
            return null;
        }

        try {
            setStatus('quoting');
            setError(null);

            const amountInWei = parseUnits(amountIn, decimalsIn);
            const { poolKey, zeroForOne } = buildPoolKey(tokenIn, tokenOut);

            console.log('[Uniswap v4] Getting quote:', {
                tokenIn,
                tokenOut,
                amountIn,
                amountInWei: amountInWei.toString(),
                poolKey,
                zeroForOne,
            });

            // Use simulateContract (struct-based parameter)
            const { result } = await publicClient.simulateContract({
                address: QUOTER as `0x${string}`,
                abi: QUOTER_ABI,
                functionName: 'quoteExactInputSingle',
                args: [
                    {
                        poolKey,
                        zeroForOne,
                        exactAmount: BigInt(amountInWei),
                        hookData: '0x' as `0x${string}`,
                    }
                ],
            });

            const amountOut = result[0];
            const amountOutAbs = amountOut < 0n ? -amountOut : amountOut;
            const amountOutFormatted = formatUnits(amountOutAbs, decimalsOut);

            // Calculate rough price impact (simplified)
            const priceImpact = 'N/A'; // Would need pool state for accurate calculation

            const quoteResult: QuoteResult = {
                amountOut: amountOutAbs.toString(),
                amountOutFormatted,
                priceImpact,
            };

            console.log('[Uniswap v4] Quote result:', quoteResult);
            setQuote(quoteResult);
            setStatus('idle');
            return quoteResult;

        } catch (err: any) {
            console.warn('[Uniswap v4] Quote failed (pool may not exist in quoter):', err.message);
            // Don't block the swap - just indicate quote isn't available
            setQuote({
                amountOut: '0',
                amountOutFormatted: 'N/A',
                priceImpact: 'N/A',
            });
            setStatus('idle'); // Allow swap to proceed
            return null;
        }
    };

    const swap = async ({ tokenIn, tokenOut, amountIn, decimalsIn = 6 }: SwapParams) => {
        if (!address || !walletClient || !publicClient) {
            setError('Wallet not connected');
            return;
        }

        try {
            setStatus('approving');
            setError(null);

            const amountInWei = parseUnits(amountIn, decimalsIn);
            const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

            console.log('[Uniswap v4] Starting swap:', {
                tokenIn,
                tokenOut,
                amountIn,
                amountInWei: amountInWei.toString(),
            });

            // Step 1: Approve Permit2 to spend the input token
            console.log('[Uniswap v4] Checking Permit2 allowance...');
            const currentAllowance = await publicClient.readContract({
                address: tokenIn as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [address, PERMIT2 as `0x${string}`],
            });

            if ((currentAllowance as bigint) < amountInWei) {
                console.log('[Uniswap v4] Approving Permit2...');
                const approveHash = await walletClient.writeContract({
                    address: tokenIn as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [PERMIT2 as `0x${string}`, maxUint256],
                });
                console.log('[Uniswap v4] Permit2 approval tx:', approveHash);
                await publicClient.waitForTransactionReceipt({ hash: approveHash });
            }

            // Step 2: Approve Universal Router on Permit2
            console.log('[Uniswap v4] Approving Universal Router via Permit2...');
            const permit2ApproveHash = await walletClient.writeContract({
                address: PERMIT2 as `0x${string}`,
                abi: PERMIT2_ABI,
                functionName: 'approve',
                args: [
                    tokenIn as `0x${string}`,
                    UNIVERSAL_ROUTER as `0x${string}`,
                    BigInt('0xffffffffffffffffffffffffffffffff') as any, // MAX_UINT160
                    deadline + 86400, // 24 hours
                ],
            });
            console.log('[Uniswap v4] Permit2 router approval tx:', permit2ApproveHash);
            await publicClient.waitForTransactionReceipt({ hash: permit2ApproveHash });

            // Step 3: Build swap using V4Planner
            setStatus('swapping');
            console.log('[Uniswap v4] Building swap with V4Planner...');

            const { poolKey, zeroForOne } = buildPoolKey(tokenIn, tokenOut);

            const swapConfig = {
                poolKey,
                zeroForOne,
                amountIn: amountInWei.toString(),
                amountOutMinimum: '0', // 0 for testnet demo
                hookData: '0x',
            };

            console.log('[Uniswap v4] Swap config:', swapConfig);

            // Use V4Planner from SDK
            const v4Planner = new V4Planner();
            const routePlanner = new RoutePlanner();

            v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [swapConfig]);
            v4Planner.addAction(Actions.SETTLE_ALL, [
                zeroForOne ? swapConfig.poolKey.currency0 : swapConfig.poolKey.currency1,
                amountInWei,
            ]);
            v4Planner.addAction(Actions.TAKE_ALL, [
                zeroForOne ? swapConfig.poolKey.currency1 : swapConfig.poolKey.currency0,
                0n,
            ]);

            const encodedActions = v4Planner.finalize();
            routePlanner.addCommand(CommandType.V4_SWAP, [v4Planner.actions, v4Planner.params]);

            console.log('[Uniswap v4] Encoded actions:', encodedActions);
            console.log('[Uniswap v4] Route commands:', routePlanner.commands);

            // Step 4: Execute swap
            console.log('[Uniswap v4] Executing swap...');
            const commands = routePlanner.commands as `0x${string}`;
            const inputs = [encodedActions] as `0x${string}`[];
            const swapHash = await walletClient.writeContract({
                address: UNIVERSAL_ROUTER as `0x${string}`,
                abi: UNIVERSAL_ROUTER_ABI,
                functionName: 'execute',
                args: [commands, inputs, BigInt(deadline)],
            });

            console.log('[Uniswap v4] Swap tx:', swapHash);
            setStatus('success');
            setTxHash(swapHash);
            return swapHash;

        } catch (err: any) {
            console.error('[Uniswap v4] Swap failed:', err);
            setError(err.shortMessage || err.message || 'Swap failed');
            setStatus('error');
        }
    };

    const reset = () => {
        setStatus('idle');
        setError(null);
        setTxHash(null);
        setQuote(null);
    };

    return {
        swap,
        getQuote,
        quote,
        status,
        error,
        txHash,
        reset,
    };
}
