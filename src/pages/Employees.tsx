import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePayroll } from '@/hooks/usePayroll';

import { PAYROLL_DISTRIBUTOR_ADDRESS } from '@/contracts';
import { useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { erc20Abi, parseEther, maxUint256 } from 'viem';
import { normalize } from 'viem/ens';
import { useBridgeKit } from '@/hooks/useBridgeKit';
import { supabase, type Employee } from '@/lib/supabase';
import { Users, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmployeeRow } from '@/components/EmployeeRow';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { Layout } from '@/components/Layout';
import { CCTPDebugger } from '@/components/CCTPDebugger';
import { PaymentWizard } from '@/components/PaymentWizard';

// Arc Testnet USDC
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

const Employees = () => {
  const { isConnected, address, connector } = useAccount();

  // Extract hash/status from payroll hook
  const { batchPay, isWritePending: isPayPending, isConfirming: isPayConfirming, hash } = usePayroll();

  // Create separate write hook for Approval
  const { writeContract: writeApprove, isPending: isApprovePending } = useWriteContract();

  // BridgeKit Hook
  const { transfer: bridgeTransfer, status: bridgeStatus } = useBridgeKit();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDebugger, setShowDebugger] = useState(false);

  // --- APPROVAL LOGIC ---

  // NATIVE PAYMENT UPDATE:
  // Arc uses Native USDC as Gas. User sends ETH (USDC) to the contract.
  // The contract then Wraps it.
  // Therefore, the USER does NOT need to Approve ERC20 spending.
  const needsApproval = false;

  const handleApprove = () => {
    writeApprove({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [PAYROLL_DISTRIBUTOR_ADDRESS, maxUint256]
    });
  };

  // Wagmi Client for ENS
  const publicClient = usePublicClient({ chainId: 11155111 }); // Force lookup on Sepolia

  const handlePayAll = async () => {
    if (employees.length === 0) return;

    // Safety Check: Ensure we are on Arc Testnet
    // Arc Testnet Chain ID: 5042002
    // If we are on Sepolia (11155111) or others, "0.2" logic would send 0.2 ETH ($600) instead of 0.2 USDC ($0.2).
    const chainId = await connector?.getChainId();
    if (chainId !== 5042002) {
      alert("Please connect to Arc Testnet (5042002) to process payroll properly. On Arc, Native Token = USDC.");
      return;
    }

    setLoading(true);

    // 1. Classify Employees (Same-Chain vs Cross-Chain)
    const batchTargets: string[] = [];
    const batchValues: string[] = [];
    const batchDatas: string[] = [];
    let batchTotal = 0n;

    console.log("Starting Payment Classification...");

    for (const emp of employees) {
      let isCrossChain = false;
      let targetChainId = 11155111; // Default to Sepolia if cross-chain detected but unknown

      try {
        if (publicClient) {
          // Explicit ENS Lookup
          const ensName = await publicClient.getEnsName({ address: emp.wallet_address as `0x${string}` });
          if (ensName) {
            const chainRecord = await publicClient.getEnsText({
              name: normalize(ensName),
              key: 'payroll.chain'
            });
            console.log(`[ENS] ${emp.name} (${ensName}) -> Chain: ${chainRecord}`);

            if (chainRecord && chainRecord !== '5042002') { // Assuming 5042002 is Arc Testnet ID
              isCrossChain = true;
              targetChainId = parseInt(chainRecord);
            }
          }
        }
      } catch (e) {
        console.warn(`[ENS] Lookup failed for ${emp.name}`, e);
      }

      if (isCrossChain) {
        // EXECUTE BRIDGEKIT
        console.log(`[Route] ${emp.name} detected as Cross-Chain (Chain ${targetChainId}). Executing BridgeKit...`);
        try {
          // Toast or status update here would be nice
          await bridgeTransfer(emp.salary.toString(), emp.wallet_address, targetChainId);
          // We could add a success toast here
        } catch (e) {
          console.error(`[BridgeKit] Failed for ${emp.name}`, e);
        }
      } else {
        // ADD TO BATCH (Same Chain)
        console.log(`[Route] ${emp.name} defaults to Same-Chain (Arc). Adding to Batch.`);
        batchTargets.push(emp.wallet_address);
        batchValues.push(emp.salary.toString());
        batchDatas.push("0x");
        batchTotal += parseEther(emp.salary.toString());
      }
    }

    // Execute Batch for remaining Same-Chain
    if (batchTargets.length > 0) {
      console.log("Executing Batch for Same-Chain...");
      batchPay(batchTargets, batchValues, batchDatas, batchTotal);
    }

    setLoading(false);
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.salary), 0);

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-2">
              Manage your team and process payroll.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDebugger(!showDebugger)}
            >
              {showDebugger ? 'Hide' : 'Show'} Debug Info
            </Button>
            <AddEmployeeDialog onEmployeeAdded={loadEmployees} />
          </div>
        </div>

        {/* CCTP Debugger - Add this temporarily */}
        {showDebugger && <CCTPDebugger />}

        <div className="grid gap-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Users className="h-12 w-12 opacity-20" />
                <p>No employees found. Add your first team member!</p>
              </div>
            </Card>
          ) : (
            employees.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} />
            ))
          )}
        </div>

        {/* Payroll Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 border-t border-border bg-background/80 backdrop-blur-lg flex items-center justify-between z-40">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Payroll</span>
            <span className="text-xl font-bold font-mono">{formatCurrency(totalPayroll)}</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Bridge Status */}
            {bridgeStatus && (
              <span className="text-xs text-blue-500 animate-pulse">
                {bridgeStatus}
              </span>
            )}

            {/* TX HASH LINK */}
            {hash && (
              <a
                href={`https://testnet.arcscan.app/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 hover:underline"
              >
                View Transaction <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* ACTION BUTTONS: APPROVE vs PAY */}
            {needsApproval ? (
              <Button
                size="lg"
                onClick={handleApprove}
                disabled={!isConnected || isApprovePending}
                className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
              >
                {isApprovePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving USDC...
                  </>
                ) : (
                  "1. Approve USDC"
                )}
              </Button>
            ) : (
              <PaymentWizard
                employees={employees}
                totalAmount={totalPayroll}
              />
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Employees;