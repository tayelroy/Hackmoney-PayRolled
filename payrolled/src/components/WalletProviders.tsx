import React from 'react';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

/**
 * Arc Mainnet Configuration
 * Optimized for the Arc L1 ecosystem mentioned in the project specs.
 * © 2026 PayRolled Treasury Solutions
 */
const arcMainnet = {
  id: 255,
  name: 'Arc Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Arc',
    symbol: 'ARC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.arc.io'] },
    public: { http: ['https://rpc.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://explorer.arc.io' },
  },
};

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
 * Note: Using simulated wallet connection for demo purposes.
 */
export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
