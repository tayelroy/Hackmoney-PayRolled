import React from 'react';
import { Layers, User, ArrowRightLeft } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { FeatureCard } from '@/components/Cards';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';

/**
 * PayRolled Landing Page
 * High-trust corporate aesthetic for institutional treasury management
 * © 2026 PayRolled Treasury Solutions
 */

/**
 * Mock ConnectButton Component
 * Simulates RainbowKit's ConnectButton for demo purposes
 */
const ConnectButton = ({ chainStatus, showBalance }: { chainStatus?: string; showBalance?: boolean }) => {
  const { isConnected } = useWallet();

  if (isConnected) {
    return null; // User will be redirected to dashboard
  }

  return (
    <Button
      className="rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
      size="lg"
    >
      Connect Wallet
    </Button>
  );
};

export default function Home() {
  // useWallet handles automatic redirect to /dashboard if connected
  useWallet();

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex flex-col">
      {/* Background Layer with Institutional Depth */}
      <div className="absolute inset-0 z-0">
        <img
          src={IMAGES.DASHBOARD_BG_1}
          alt="Background"
          className="w-full h-full object-cover opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      {/* Header / Logo Section */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center p-1 bg-white/5 rounded-2xl border border-white/10 shadow-lg overflow-hidden backdrop-blur-sm">
            <img src="/logo.png" alt="PayRolled Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight">PayRolled</span>
        </div>
        <div className="hidden md:block">
          <ConnectButton chainStatus="none" showBalance={false} />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v2.0 Now Live on Arc Mainnet
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
              Global Payroll, <br />
              <span className="text-primary">Local Liquidity.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Streamline your treasury on Arc. Pay your team on any chain instantly
              with institutional-grade security and automated compliance.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="scale-125 md:scale-150 py-8">
              <ConnectButton />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Supported Assets: USDC • ARCO • WETH • WBTC
            </p>
          </div>
        </div>

        {/* Social Proof / Feature Grid */}
        <div className="mt-24 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <FeatureCard
            icon={<img src="/logo.png" alt="Arc" className="w-5 h-5 object-contain opacity-80" />}
            title="Powered by Arc"
            description="Built on the world's most capital-efficient Layer-1 for stablecoin finance."
          />
          <FeatureCard
            icon={<User className="w-5 h-5 text-primary" />}
            title="Identity by ENS"
            description="Native integration with Ethereum Name Service for seamless employee onboarding."
          />
          <FeatureCard
            icon={<ArrowRightLeft className="w-5 h-5 text-primary" />}
            title="Bridged by LI.FI"
            description="Enterprise-grade cross-chain liquidity protocol for global distribution."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 PayRolled Treasury Solutions. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">API Docs</a>
          </div>
        </div>
      </footer>

      {/* Decorative Crypto Elements */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </div>
  );
}
