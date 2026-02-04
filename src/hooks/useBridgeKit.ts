import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { BridgeKit } from '@circle-fin/bridge-kit';

export const useBridgeKit = () => {
    const { address, connector } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [status, setStatus] = useState<'idle' | 'bridging' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const transfer = async (amount: string, recipient: string, destinationChainId: number) => {
        if (!walletClient || !address || !connector) {
            console.error("No wallet client, address or connector");
            return;
        }

        setStatus('bridging');
        setError(null);

        try {
            console.log(`[BridgeKit] Initiating automated bridge of ${amount} USDC to ${recipient}`);

            // 1. Initialize Adapter and SDK
            // Using the exact pattern verified in src/pages/test.tsx
            const providerInstance = await connector.getProvider();
            const adapter = await createViemAdapterFromProvider({
                provider: providerInstance as any
            });

            const kit = new BridgeKit({
                testnet: true // Explicitly strictly use testnet defaults
            });

            // 2. Map Destination Chain Identifier
            // Using string identifiers as confirmed working in test.tsx
            let targetChainIdentifier = 'Ethereum_Sepolia';
            if (destinationChainId === 84532) targetChainIdentifier = 'Base_Sepolia';

            // 3. Execute Full Bridge (Burn -> Wait -> Mint)
            const result = await kit.bridge({
                amount,
                token: 'USDC',
                from: {
                    adapter,
                    chain: 'Arc_Testnet'
                },
                to: {
                    adapter,
                    chain: targetChainIdentifier,
                    recipientAddress: recipient
                }
            });

            console.log("[BridgeKit] Bridge complete:", result);

            if (result.state === 'success') {
                setStatus('success');
                return result;
            } else {
                throw new Error(`Bridge failed with state: ${result.state}`);
            }

        } catch (e: any) {
            console.error("BridgeKit Error:", e);
            setStatus('error');
            setError(e.message || "Bridge failed");
            throw e;
        }
    };

    return { transfer, status, error };
};
