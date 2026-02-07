import { useState, useCallback } from 'react';
import JSBI from 'jsbi';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { Token, Percent } from '@uniswap/sdk-core';
import { Pool, Position, V4PositionManager } from '@uniswap/v4-sdk';
import { nearestUsableTick, TickMath, encodeSqrtRatioX96 } from '@uniswap/v3-sdk';
import { UNISWAP_V4_BASE_SEPOLIA, ERC20_ABI } from '@/lib/uniswap-v4';

export type LiquidityStatus = 'idle' | 'approving' | 'adding' | 'success' | 'error';

interface AddLiquidityParams {
    token0Address: string;
    token1Address: string;
    amount0: string;
    amount1: string;
    decimals0?: number;
    decimals1?: number;
}

// Base Sepolia contract addresses from Uniswap v4 deployments
const POSITION_MANAGER = '0x4b2c77d209d3405f41a037ec6c77f7f5b8e2ca80';
const STATE_VIEW = '0x571291b572ed32ce6751a2cb2486ebee8defb9b4';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const CHAIN_ID = 84532; // Base Sepolia

// StateView ABI for fetching pool state
const STATE_VIEW_ABI = [
    {
        inputs: [{ name: 'poolId', type: 'bytes32' }],
        name: 'getSlot0',
        outputs: [
            { name: 'sqrtPriceX96', type: 'uint160' },
            { name: 'tick', type: 'int24' },
            { name: 'protocolFee', type: 'uint24' },
            { name: 'lpFee', type: 'uint24' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'poolId', type: 'bytes32' }],
        name: 'getLiquidity',
        outputs: [{ name: 'liquidity', type: 'uint128' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

// PositionManager ABI with custom errors for decoding
const POSITION_MANAGER_ABI = [
    // Functions
    {
        inputs: [{ name: 'data', type: 'bytes[]' }],
        name: 'multicall',
        outputs: [{ name: 'results', type: 'bytes[]' }],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'unlockData', type: 'bytes' },
            { name: 'deadline', type: 'uint256' },
        ],
        name: 'modifyLiquidities',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    // Custom Errors from PositionManager and related contracts
    { type: 'error', name: 'PoolNotInitialized', inputs: [] },
    { type: 'error', name: 'TickSpacingTooLarge', inputs: [{ name: 'tickSpacing', type: 'int24' }] },
    { type: 'error', name: 'TickSpacingTooSmall', inputs: [{ name: 'tickSpacing', type: 'int24' }] },
    { type: 'error', name: 'CurrenciesOutOfOrderOrEqual', inputs: [{ name: 'currency0', type: 'address' }, { name: 'currency1', type: 'address' }] },
    { type: 'error', name: 'TicksMisordered', inputs: [{ name: 'tickLower', type: 'int24' }, { name: 'tickUpper', type: 'int24' }] },
    { type: 'error', name: 'TickLowerOutOfBounds', inputs: [{ name: 'tickLower', type: 'int24' }] },
    { type: 'error', name: 'TickUpperOutOfBounds', inputs: [{ name: 'tickUpper', type: 'int24' }] },
    { type: 'error', name: 'InvalidTick', inputs: [{ name: 'tick', type: 'int24' }] },
    { type: 'error', name: 'DeadlinePassed', inputs: [{ name: 'deadline', type: 'uint256' }] },
    { type: 'error', name: 'NotApproved', inputs: [{ name: 'caller', type: 'address' }] },
    { type: 'error', name: 'InsufficientBalance', inputs: [] },
    { type: 'error', name: 'InvalidCalldataLength', inputs: [] },
    { type: 'error', name: 'SlippageCheckFailed', inputs: [{ name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }] },
    { type: 'error', name: 'MaximumAmountExceeded', inputs: [{ name: 'maximumAmount', type: 'uint128' }, { name: 'amountRequested', type: 'uint128' }] },
    { type: 'error', name: 'MinimumAmountInsufficient', inputs: [{ name: 'minimumAmount', type: 'uint128' }, { name: 'amountReceived', type: 'uint128' }] },
    { type: 'error', name: 'ActionNotSelfOnly', inputs: [{ name: 'action', type: 'uint256' }] },
    { type: 'error', name: 'UnsupportedAction', inputs: [{ name: 'action', type: 'uint256' }] },
    { type: 'error', name: 'NotPoolManagerToken', inputs: [] },
    { type: 'error', name: 'NotPoolManager', inputs: [] },
    { type: 'error', name: 'InvalidTokenId', inputs: [{ name: 'tokenId', type: 'uint256' }] },
    { type: 'error', name: 'ClearPositionNotEmpty', inputs: [{ name: 'tokenId', type: 'uint256' }] },
    { type: 'error', name: 'InvalidBips', inputs: [] },
    // PoolManager errors that may propagate
    { type: 'error', name: 'PoolAlreadyInitialized', inputs: [] },
    { type: 'error', name: 'SwapAmountCannotBeZero', inputs: [] },
    { type: 'error', name: 'NonzeroNativeValue', inputs: [] },
    { type: 'error', name: 'MustClearExactPositiveDelta', inputs: [{ name: 'currency', type: 'address' }, { name: 'delta', type: 'int256' }] },
    { type: 'error', name: 'CurrencyNotSettled', inputs: [] },
    { type: 'error', name: 'InvalidCaller', inputs: [] },
    { type: 'error', name: 'ManagerLocked', inputs: [] },
    { type: 'error', name: 'AlreadyUnlocked', inputs: [] },
] as const;

const PERMIT2_ABI = [
    {
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'token', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [
            { name: 'amount', type: 'uint160' },
            { name: 'expiration', type: 'uint48' },
            { name: 'nonce', type: 'uint48' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
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

// Helper to sort tokens (v4 requires currency0 < currency1)
function sortTokens(tokenA: Token, tokenB: Token): [Token, Token] {
    return tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
}

// Helper for BigInt square root
function bigIntSqrt(value: bigint): bigint {
    if (value < 0n) throw new Error('Square root of negative number');
    if (value < 2n) return value;
    let x = value / 2n + 1n;
    let y = (x + value / x) / 2n;
    while (y < x) {
        x = y;
        y = (x + value / x) / 2n;
    }
    return x;
}

export function useAddLiquidity() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const [status, setStatus] = useState<LiquidityStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const addLiquidity = async ({
        token0Address,
        token1Address,
        amount0,
        amount1,
        decimals0 = 6,
        decimals1 = 18,
    }: AddLiquidityParams) => {
        if (!address || !walletClient || !publicClient) {
            setError('Wallet not connected');
            return;
        }

        try {
            setStatus('approving');
            setError(null);
            setTxHash(null);

            // Step 1: Define Token Information
            const tokenA = new Token(CHAIN_ID, token0Address, decimals0, 'USDC', 'USD Coin');
            const tokenB = new Token(CHAIN_ID, token1Address, decimals1, 'WETH', 'Wrapped Ether');

            // Sort tokens (v4 requires token0 < token1)
            const [token0, token1] = sortTokens(tokenA, tokenB);
            const token0IsA = token0.address.toLowerCase() === tokenA.address.toLowerCase();

            console.log('[Add Liquidity] Token order:', {
                token0: token0.symbol,
                token1: token1.symbol,
                token0IsA,
            });

            // Pool parameters
            const fee = 10000; // 1%
            const tickSpacing = 200;
            const hookAddress = '0x0000000000000000000000000000000000000000';

            // Step 2: Try to fetch pool state (pool may not exist yet)
            let sqrtPriceX96Current: bigint = 0n;
            let currentTick: number = 0;
            let currentLiquidity: bigint = 0n;
            let poolExists = true;

            try {
                // Get the pool ID
                const poolId = Pool.getPoolId(token0, token1, fee, tickSpacing, hookAddress);
                console.log('[Add Liquidity] Pool ID:', poolId);

                const [slot0, liquidity] = await Promise.all([
                    publicClient.readContract({
                        address: STATE_VIEW as `0x${string}`,
                        abi: STATE_VIEW_ABI,
                        functionName: 'getSlot0',
                        args: [poolId as `0x${string}`],
                    }),
                    publicClient.readContract({
                        address: STATE_VIEW as `0x${string}`,
                        abi: STATE_VIEW_ABI,
                        functionName: 'getLiquidity',
                        args: [poolId as `0x${string}`],
                    }),
                ]);

                sqrtPriceX96Current = slot0[0] as bigint;
                currentTick = slot0[1] as number;
                currentLiquidity = liquidity as bigint;

                // Check if pool exists (sqrtPriceX96 will be 0 if not initialized)
                if (sqrtPriceX96Current === 0n) {
                    poolExists = false;
                    console.log('[Add Liquidity] Pool does not exist, will initialize');
                }
            } catch (err) {
                console.log('[Add Liquidity] Pool state fetch failed, assuming new pool');
                poolExists = false;
            }

            // If pool doesn't exist, use a default starting price
            // For USDC/WETH, assuming ~$2000/ETH: 1 WETH = 2000 USDC
            // sqrtPriceX96 = sqrt(price) * 2^96
            if (!poolExists) {
                // Calculate price using raw amounts to account for decimal differences
                const amount0Raw = parseUnits(amount0, decimals0);
                const amount1Raw = parseUnits(amount1, decimals1);

                // Use SDK utility for precise calculation
                // encodeSqrtRatioX96 takes (numerator, denominator) whch corresponds to (amount1, amount0)
                // because price = amount1 / amount0
                // Both arguments must be JSBI
                const sqrtRatioX96 = encodeSqrtRatioX96(JSBI.BigInt(amount1Raw.toString()), JSBI.BigInt(amount0Raw.toString()));
                sqrtPriceX96Current = BigInt(sqrtRatioX96.toString());

                console.log('[Add Liquidity] Calculated Price:', {
                    amount0: amount0Raw.toString(),
                    amount1: amount1Raw.toString(),
                    sqrtPriceX96: sqrtPriceX96Current.toString()
                });

                // CRITICAL: currentTick MUST match sqrtPriceX96 or Position.fromAmounts will fail with ZERO_LIQUIDITY
                currentTick = TickMath.getTickAtSqrtRatio(sqrtRatioX96);
                currentLiquidity = 0n;
            }

            // Step 3: Create Pool instance
            const pool = new Pool(
                token0,
                token1,
                fee,
                tickSpacing,
                hookAddress,
                sqrtPriceX96Current.toString(),
                currentLiquidity.toString(),
                currentTick
            );

            console.log('[Add Liquidity] Pool created:', {
                tick: pool.tickCurrent,
                sqrtPriceX96: pool.sqrtRatioX96.toString(),
            });

            // Step 4: Define position parameters (full range)
            const MIN_TICK = -887272;
            const MAX_TICK = 887272;
            const tickLower = nearestUsableTick(MIN_TICK, tickSpacing);
            const tickUpper = nearestUsableTick(MAX_TICK, tickSpacing);

            // Convert amounts
            const amountADesired = parseUnits(amount0, decimals0);
            const amountBDesired = parseUnits(amount1, decimals1);

            const amount0Desired = token0IsA ? amountADesired.toString() : amountBDesired.toString();
            const amount1Desired = token0IsA ? amountBDesired.toString() : amountADesired.toString();

            console.log('[Add Liquidity] Position params:', {
                tickLower,
                tickUpper,
                amount0Desired,
                amount1Desired,
            });

            // Step 5: Create Position
            const position = Position.fromAmounts({
                pool,
                tickLower,
                tickUpper,
                amount0: amount0Desired,
                amount1: amount1Desired,
                useFullPrecision: true,
            });

            console.log('[Add Liquidity] Position created:', {
                liquidity: position.liquidity.toString(),
                amount0: position.amount0.toExact(),
                amount1: position.amount1.toExact(),
            });

            if (JSBI.equal(position.liquidity, JSBI.BigInt(0))) {
                setStatus('error');
                setError('ZERO_LIQUIDITY: The calculated liquidity is 0. This happens if the price is far outside your range, but we are using full range. Please check your token amounts.');
                return;
            }

            // Step 5.5: Permit2 Approval Flow
            // 1. ERC20.approve(PERMIT2, amount)
            // 2. Permit2.approve(token, POSITION_MANAGER, amount, expiration)
            for (const [token, amount] of [
                [token0.address, amount0Desired],
                [token1.address, amount1Desired],
            ] as const) {
                const amountBI = BigInt(amount);

                // Check ERC20 -> Permit2 allowance
                const erc20Allowance = await publicClient.readContract({
                    address: token as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: 'allowance',
                    args: [address, PERMIT2 as `0x${string}`],
                });

                if ((erc20Allowance as bigint) < amountBI) {
                    console.log(`[Add Liquidity] Approving ${token} to Permit2...`);
                    const approveHash = await walletClient.writeContract({
                        address: token as `0x${string}`,
                        abi: ERC20_ABI,
                        functionName: 'approve',
                        args: [PERMIT2 as `0x${string}`, maxUint256],
                    });
                    await publicClient.waitForTransactionReceipt({ hash: approveHash });
                }

                // Check Permit2 -> PositionManager allowance
                const [p2Amount, p2Expiration] = await publicClient.readContract({
                    address: PERMIT2 as `0x${string}`,
                    abi: PERMIT2_ABI,
                    functionName: 'allowance',
                    args: [address, token as `0x${string}`, POSITION_MANAGER as `0x${string}`],
                }) as [bigint, number, number];

                const now = Math.floor(Date.now() / 1000);
                if (p2Amount < amountBI || p2Expiration < now + 600) {
                    console.log(`[Add Liquidity] Granting Permit2 allowance for ${token} to PositionManager...`);
                    const p2ApproveHash = await walletClient.writeContract({
                        address: PERMIT2 as `0x${string}`,
                        abi: PERMIT2_ABI,
                        functionName: 'approve',
                        args: [
                            token as `0x${string}`,
                            POSITION_MANAGER as `0x${string}`,
                            2n ** 160n - 1n, // Max uint160
                            Math.floor(Date.now() / 1000) + 3600 * 24 * 30, // 30 days
                        ],
                    });
                    await publicClient.waitForTransactionReceipt({ hash: p2ApproveHash });
                }
            }

            setStatus('adding');

            // Step 6: Generate mint transaction using SDK
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

            const mintOptions = {
                recipient: address,
                slippageTolerance: new Percent(50, 10000), // 0.5%
                deadline: deadline.toString(),
                hookData: '0x' as `0x${string}`,
                createPool: !poolExists,
                sqrtPriceX96: !poolExists ? sqrtPriceX96Current.toString() : undefined,
            };

            console.log('[Add Liquidity] Mint options:', mintOptions);

            const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions);

            console.log('[Add Liquidity] Generated calldata:', calldata.slice(0, 100) + '...');
            console.log('[Add Liquidity] Value:', value);

            // Step 7: Execute the transaction via multicall
            const txHashResult = await walletClient.writeContract({
                address: POSITION_MANAGER as `0x${string}`,
                abi: POSITION_MANAGER_ABI,
                functionName: 'multicall',
                args: [[calldata as `0x${string}`]],
                value: BigInt(value),
            });

            console.log('[Add Liquidity] Tx hash:', txHashResult);
            setTxHash(txHashResult);

            await publicClient.waitForTransactionReceipt({ hash: txHashResult });
            setStatus('success');
            return txHashResult;

        } catch (err: any) {
            console.error('[Add Liquidity] Failed:', err);
            setError(err.shortMessage || err.message || 'Failed to add liquidity');
            setStatus('error');
        }
    };

    const reset = () => {
        setStatus('idle');
        setError(null);
        setTxHash(null);
    };

    return {
        addLiquidity,
        status,
        error,
        txHash,
        reset,
    };
}
