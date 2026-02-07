import React from 'react';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from 'wagmi';
import { type Chain } from 'viem';
import { injected } from 'wagmi/connectors';

/**
 * Arc Testnet Configuration
 * Chain ID: 5042002
 */
const arcTestnet = {
  id: 5_042_002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC', // Arc uses native USDC as gas
    symbol: 'USDC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
} as const satisfies Chain;

import { sepolia, baseSepolia } from 'wagmi/chains';

export const config = createConfig({
  chains: [arcTestnet, sepolia, baseSepolia],
  transports: {
    [arcTestnet.id]: http(),
    [sepolia.id]: http("https://1rpc.io/sepolia"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
  connectors: [
    injected(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * WalletProviders Component
 * Wraps the application with necessary Web3 and Data fetching contexts.
 */
export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
