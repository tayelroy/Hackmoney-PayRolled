import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { erc20Abi, parseUnits, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const TOKEN_MESSENGER = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';

export function CCTPDebugger() {
  const { address } = useAccount();

  // Check USDC balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, TOKEN_MESSENGER] : undefined,
  });

  const handleRefresh = () => {
    refetchBalance();
    refetchAllowance();
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-bold">CCTP Debug Info</h2>
      
      <div className="space-y-2">
        <div>
          <span className="font-semibold">Your Address:</span>
          <p className="font-mono text-sm">{address || 'Not connected'}</p>
        </div>

        <div>
          <span className="font-semibold">USDC Balance (6 decimals):</span>
          <p className="font-mono text-sm">
            {balance ? `${formatUnits(balance, 6)} USDC` : 'Loading...'}
          </p>
          <p className="text-xs text-muted-foreground">
            Raw: {balance?.toString() || '0'}
          </p>
        </div>

        <div>
          <span className="font-semibold">Allowance for TokenMessenger:</span>
          <p className="font-mono text-sm">
            {allowance ? `${formatUnits(allowance, 6)} USDC` : 'Loading...'}
          </p>
          <p className="text-xs text-muted-foreground">
            Raw: {allowance?.toString() || '0'}
          </p>
          {allowance !== undefined && allowance === 0n && (
            <p className="text-red-500 text-sm mt-1">
              ⚠️ NO APPROVAL! You need to approve TokenMessenger before bridging.
            </p>
          )}
        </div>
      </div>

      <Button onClick={handleRefresh}>Refresh Data</Button>

      <div className="border-t pt-4 mt-4 text-sm">
        <p className="font-semibold mb-2">What this means:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Balance: How much USDC you have</li>
          <li>Allowance: How much USDC the TokenMessenger can spend</li>
          <li>If allowance is 0, you need to approve first!</li>
        </ul>
      </div>
    </Card>
  );
}