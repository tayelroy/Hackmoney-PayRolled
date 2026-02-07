// Aave V3 Base Sepolia Contract Addresses
// Source: https://github.com/bgd-labs/aave-address-book

export const AAVE_BASE_SEPOLIA = {
    // Core Contracts
    POOL: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27',
    POOL_ADDRESSES_PROVIDER: '0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00',
    DATA_PROVIDER: '0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b',

    // Tokens
    WETH: '0x4200000000000000000000000000000000000006', // Base Sepolia WETH
    aWETH: '0xe7a5C73516597116D545F31f1f2B2C9a2283e3F6',

    // USDC (Native/Bridged for Aave)
    USDC: '0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f',
    aUSDC: '0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC',

    // Chain ID
    CHAIN_ID: 84532, // Base Sepolia
} as const;

// Minimal Aave Pool ABI - only the supply function we need
export const AAVE_POOL_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'onBehalfOf', type: 'address' },
            { internalType: 'uint16', name: 'referralCode', type: 'uint16' },
        ],
        name: 'supply',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

// aToken ABI - for checking balances
export const AAVE_ATOKEN_ABI = [
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;
