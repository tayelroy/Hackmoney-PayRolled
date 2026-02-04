import { useState } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const TestBridgeKit = () => {
    const { data: walletClient } = useWalletClient();
    const { connector } = useAccount();
    const [status, setStatus] = useState("Idle");

    const runTest = async () => {
        if (!walletClient || !connector) return alert("Connect Wallet first");

        try {
            setStatus("1. Initializing SDK...");

            const provider = await connector.getProvider();
            const adapter = await createViemAdapterFromProvider({ provider: provider as any });
            const kit = new BridgeKit();

            setStatus("2. Calling kit.bridge()...");
            console.log("Starting BridgeKit transfer...");

            // We use a tiny amount to test
            const result = await kit.bridge({
                amount: '0.1', // 0.1 USDC
                from: {
                    adapter,
                    chain: 'Arc_Testnet'
                },
                to: {
                    adapter,
                    chain: 'Base_Sepolia',
                    recipientAddress: walletClient.account.address // Send to self
                },
                token: 'USDC'
            });

            console.log("Bridge Result:", result);
            if (result.state === 'success') {
                setStatus("3. SUCCESS! Bridge complete.");
                toast.success("It worked! Check console.");
            } else {
                setStatus(`FAILED at step: ${result.state}`);
                console.error("Bridge Result failed:", result);
            }

        } catch (error: any) {
            console.error("TEST FAILED:", error);
            setStatus(`FAILED: ${error.message || error}`);
            toast.error("Test Failed. See screen.");
        }
    };

    return (
        <div className="p-10 flex flex-col items-center gap-6 bg-slate-900 text-white min-h-screen">
            <h1 className="text-2xl font-bold">🧪 BridgeKit Quickstart Test</h1>

            <div className="p-4 bg-black rounded-lg border border-gray-700 w-full max-w-md font-mono text-sm">
                Status: <span className="text-yellow-400">{status}</span>
            </div>

            <Button
                onClick={runTest}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white"
            >
                Run kit.bridge()
            </Button>

            <div className="text-xs text-gray-400 max-w-md text-center">
                Testing standard <code>@circle-fin/bridge-kit</code> implementation.
                <br />Watch your wallet for prompts.
            </div>
        </div>
    );
};