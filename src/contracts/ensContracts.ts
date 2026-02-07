/**
 * ENS Contract ABIs and Addresses for Sepolia
 * Used for subdomain minting and text record management
 */

// ENS Registry on Sepolia
export const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const;

// Public Resolver on Sepolia
export const ENS_PUBLIC_RESOLVER_ADDRESS = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as const;

// Parent domain for PayRolled subdomains
export const PARENT_DOMAIN = 'payrolled.eth' as const;

// ENS Registry ABI (minimal - only what we need)
export const ENS_REGISTRY_ABI = [
    {
        name: 'setSubnodeRecord',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'label', type: 'bytes32' },
            { name: 'owner', type: 'address' },
            { name: 'resolver', type: 'address' },
            { name: 'ttl', type: 'uint64' }
        ],
        outputs: []
    },
    {
        name: 'owner',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'node', type: 'bytes32' }],
        outputs: [{ name: '', type: 'address' }]
    },
    {
        name: 'resolver',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'node', type: 'bytes32' }],
        outputs: [{ name: '', type: 'address' }]
    }
] as const;

// Public Resolver ABI (minimal - only what we need)
export const ENS_RESOLVER_ABI = [
    {
        name: 'setText',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'key', type: 'string' },
            { name: 'value', type: 'string' }
        ],
        outputs: []
    },
    {
        name: 'text',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'key', type: 'string' }
        ],
        outputs: [{ name: '', type: 'string' }]
    }
] as const;
