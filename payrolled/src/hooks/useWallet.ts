import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ROUTE_PATHS } from '@/lib/index';

/**
 * useWallet Hook
 * Provides wallet connection state and management via wagmi.
 */
export function useWallet() {
  const { address, isConnected, chain, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const navigate = useNavigate();
  const location = useLocation();

  // Helper to connect using the first available connector (usually Injected/MetaMask)
  const connectWallet = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  useEffect(() => {
    // Only redirect if explicitly in a connection flow, or strict auth gating is desired.
    // Minimizing auto-redirects prevents annoyance if wallet disconnects temporarily.
    const isHomePage = location.pathname === ROUTE_PATHS.HOME;
    const isDashboardRoute = location.pathname.startsWith(ROUTE_PATHS.DASHBOARD);

    if (isConnected && isHomePage) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }

    if (!isConnected && isDashboardRoute) {
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isConnected, location.pathname, navigate]);

  return {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
    chain,
    networkName: chain?.name || 'Unknown Network',
  };
}
