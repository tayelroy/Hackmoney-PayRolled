import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createWalletClient, http, namehash, keccak256, toBytes } from 'https://esm.sh/viem@2.45.1';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.45.1/accounts';
import { sepolia } from 'https://esm.sh/viem@2.45.1/chains';

// ENS Contract addresses on Sepolia
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_PUBLIC_RESOLVER_ADDRESS = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
const PARENT_DOMAIN = 'payrolled.eth';

// ENS Registry ABI (minimal)
const ENS_REGISTRY_ABI = [
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
    }
] as const;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { label, ownerAddress } = await req.json();

        // Validate inputs
        if (!label || typeof label !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Label is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!ownerAddress || !/^0x[a-fA-F0-9]{40}$/.test(ownerAddress)) {
            return new Response(
                JSON.stringify({ error: 'Valid owner address is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate label format
        const sanitizedLabel = label.toLowerCase().trim();
        if (!/^[a-z0-9-]+$/.test(sanitizedLabel) || sanitizedLabel.length < 3 || sanitizedLabel.length > 32) {
            return new Response(
                JSON.stringify({ error: 'Invalid label format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get admin private key from environment
        const adminPrivateKey = Deno.env.get('ENS_ADMIN_PRIVATE_KEY');
        if (!adminPrivateKey) {
            console.error('ENS_ADMIN_PRIVATE_KEY not configured');
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create wallet client with admin account
        const account = privateKeyToAccount(adminPrivateKey as `0x${string}`);
        const walletClient = createWalletClient({
            account,
            chain: sepolia,
            transport: http('https://eth-sepolia.g.alchemy.com/v2/ALCHEMY_API_KEY'),
        });

        // Calculate namehash of parent domain and label hash
        const parentNode = namehash(PARENT_DOMAIN);
        const labelHash = keccak256(toBytes(sanitizedLabel));

        console.log(`Minting subdomain: ${sanitizedLabel}.${PARENT_DOMAIN} for ${ownerAddress}`);

        // Call setSubnodeRecord
        const hash = await walletClient.writeContract({
            address: ENS_REGISTRY_ADDRESS,
            abi: ENS_REGISTRY_ABI,
            functionName: 'setSubnodeRecord',
            args: [
                parentNode,
                labelHash,
                ownerAddress as `0x${string}`,
                ENS_PUBLIC_RESOLVER_ADDRESS,
                BigInt(0) // TTL
            ],
        });

        console.log(`Transaction sent: ${hash}`);

        return new Response(
            JSON.stringify({
                success: true,
                txHash: hash,
                subdomain: `${sanitizedLabel}.${PARENT_DOMAIN}`,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error minting subdomain:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to mint subdomain' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
