import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';

/**
 * useWallet Hook
 * Provides wallet connection state and management.
 * Note: Using simulated state as the wagmi dependency is not available in this environment.
 */
export function useWallet() {
  // Simulated wallet state for the Arc Layer-1 ecosystem
  const [address, setAddress] = useState<string | undefined>('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting] = useState(false);
  const [chain] = useState({ name: 'Arc Mainnet' });

  const navigate = useNavigate();
  const location = useLocation();

  const disconnect = () => {
    setIsConnected(false);
    setAddress(undefined);
  };

  useEffect(() => {
    if (isConnecting) return;

    const isHomePage = location.pathname === ROUTE_PATHS.HOME;
    const isDashboardRoute = location.pathname.startsWith(ROUTE_PATHS.DASHBOARD);

    if (isConnected && isHomePage) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }

    if (!isConnected && isDashboardRoute) {
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isConnected, isConnecting, location.pathname, navigate]);

  return {
    address,
    isConnected,
    isConnecting,
    disconnect,
    chain,
    networkName: chain?.name || 'Arc Mainnet',
  };
}
