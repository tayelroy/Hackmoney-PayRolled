// Uniswap v4 Base Sepolia Configuration
// Aligned with HackMoney Agentic Finance Track

export const UNISWAP_V4_BASE_SEPOLIA = {
    // Core Contracts (from official Uniswap deployment)
    POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408',
    UNIVERSAL_ROUTER: '0x492E6456D9528771018DeB9E87ef7750EF184104',
    POSITION_MANAGER: '0x4b2c77d209d3405f41a037ec6c77f7f5b8e2ca80',
    QUOTER: '0x4a6513c898fe1b2d0e78d3b0e0a4a151589b1cba',
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    STATE_VIEW: '0x571291b572ed32ce6751a2cb2486ebee8defb9b4',

    // Tokens on Base Sepolia
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',

    CHAIN_ID: 84532,
} as const;

// Pool fee tier (1% = 10000)
export const DEFAULT_POOL_FEE = 10000;
export const DEFAULT_TICK_SPACING = 200;

// Universal Router command types
export const COMMANDS = {
    V4_SWAP: 0x10,
    SETTLE: 0x09,
    TAKE: 0x0a,
    PERMIT2_PERMIT: 0x0a,
    PERMIT2_TRANSFER_FROM: 0x0b,
} as const;

// Minimal ABIs for direct contract interaction
export const UNIVERSAL_ROUTER_ABI = [
    {
        inputs: [
            { name: 'commands', type: 'bytes' },
            { name: 'inputs', type: 'bytes[]' },
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
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

export const QUOTER_ABI = [
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

export const ERC20_ABI = [
    {
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        name: 'approve',
        outputs: [{ type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        name: 'allowance',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;
