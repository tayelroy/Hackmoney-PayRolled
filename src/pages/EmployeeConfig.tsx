import { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, ShieldCheck, AlertCircle, Wallet, Save, Sparkles, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { injected } from 'wagmi/connectors';
import { usePayrollConfig } from '@/hooks/usePayrollConfig';
import { useSetEnsText } from '@/hooks/useSetEnsText';
import { useEnsSubdomain } from '@/hooks/useEnsSubdomain';
import { formatAddress, getChainName } from '@/lib/index';
import { PARENT_DOMAIN } from '@/contracts/ensContracts';

// Image for Primary Name setup guide (user will provide)
const PRIMARY_NAME_GUIDE_IMAGE = '/ens-primary-name-guide.png';

// Supported chains for payroll delivery
const SUPPORTED_CHAINS = [
    { id: '11155111', name: 'Sepolia Testnet' },
    { id: '8453', name: 'Base' },
    { id: '84532', name: 'Base Sepolia' },
    { id: '5042002', name: 'Arc Testnet' },
];

// Supported currencies
const SUPPORTED_CURRENCIES = ['USDC', 'USDT', 'DAI'];

export default function EmployeeConfig() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { ensName, preferredChainId, preferredCurrency, loading } = usePayrollConfig(address);
    const { setTextRecord, loading: savingText } = useSetEnsText();
    const { mintSubdomain, loading: minting } = useEnsSubdomain();

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editChain, setEditChain] = useState<string>('');
    const [editCurrency, setEditCurrency] = useState<string>('');

    // Subdomain state
    const [subdomainLabel, setSubdomainLabel] = useState('');

    // Pending Primary Name state (from localStorage)
    const [pendingPrimaryName, setPendingPrimaryName] = useState<string | null>(null);

    // Check for pending Primary Name on mount and when ensName changes
    useEffect(() => {
        if (!address) return;
        const pending = localStorage.getItem(`payrolled_pending_primary_${address}`);

        // If we have a pending name but the user now has ensName set, clear the pending
        if (pending && ensName) {
            localStorage.removeItem(`payrolled_pending_primary_${address}`);
            setPendingPrimaryName(null);
        } else if (pending && !ensName) {
            setPendingPrimaryName(pending);
        }
    }, [address, ensName]);

    // Initialize edit values when entering edit mode
    const handleStartEdit = () => {
        setEditChain(preferredChainId?.toString() || '');
        setEditCurrency(preferredCurrency || 'USDC');
        setIsEditing(true);
    };

    // Save changes to ENS
    const handleSave = async () => {
        if (!ensName) return;

        // Save chain if changed
        if (editChain && editChain !== preferredChainId?.toString()) {
            await setTextRecord(ensName, 'payroll.chain', editChain);
        }

        // Save currency if changed
        if (editCurrency && editCurrency !== preferredCurrency) {
            await setTextRecord(ensName, 'payroll.currency', editCurrency);
        }

        setIsEditing(false);
    };

    // Mint subdomain
    const handleMintSubdomain = async () => {
        const result = await mintSubdomain(subdomainLabel);
        if (result) {
            setSubdomainLabel('');
            setPendingPrimaryName(result); // Show the Primary Name setup card
        }
    };

    // Clear the pending state (for "I've done this" button)
    const handleConfirmPrimarySet = () => {
        if (address) {
            localStorage.removeItem(`payrolled_pending_primary_${address}`);
        }
        setPendingPrimaryName(null);
        // Force a page reload to re-fetch ENS data
        window.location.reload();
    };

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Required</h1>
                    <p className="text-muted-foreground max-w-md">Connect your wallet to configure your payroll settings.</p>
                    <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payroll Configuration</h1>
                    <p className="text-muted-foreground">Manage your self-sovereign payroll preferences via ENS.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* DIGITAL ID CARD */}
                    <div className="md:col-span-1">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl p-6 border border-slate-700">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full -mr-12 -mt-12 pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold mb-4">
                                    {ensName ? ensName.charAt(0).toUpperCase() : '?'}
                                </div>
                                <h2 className="text-lg font-bold tracking-wide truncate w-full px-2">
                                    {ensName || formatAddress(address)}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">
                                    {formatAddress(address)}
                                </p>

                                <div className="w-full mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-emerald-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                        {ensName ? 'Verified Identity' : 'No ENS Name'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONFIG CARD */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="p-8 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-md">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900">ENS Payroll Config</h3>
                                    <p className="text-sm text-slate-500">
                                        {ensName ? 'Settings fetched live from Ethereum.' : 'Claim your subdomain to get started.'}
                                    </p>
                                </div>
                                {loading && <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full" />}
                            </div>

                            {ensName ? (
                                // User HAS ENS - Show config with edit capability
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Chain</p>
                                            {isEditing ? (
                                                <Select value={editChain} onValueChange={setEditChain}>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Select chain" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {SUPPORTED_CHAINS.map((chain) => (
                                                            <SelectItem key={chain.id} value={chain.id}>
                                                                {chain.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                                    <span className="font-mono text-emerald-600 font-bold">
                                                        {getChainName(preferredChainId)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Currency</p>
                                            {isEditing ? (
                                                <Select value={editCurrency} onValueChange={setEditCurrency}>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Select currency" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {SUPPORTED_CURRENCIES.map((currency) => (
                                                            <SelectItem key={currency} value={currency}>
                                                                {currency}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                                    <span className="font-mono text-slate-700 font-bold">{preferredCurrency || 'USDC'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <h4 className="text-sm font-bold text-emerald-900 mb-2">Self-Sovereign Rule</h4>
                                        <p className="text-xs text-emerald-800 leading-relaxed">
                                            We read <code className="bg-emerald-100 px-1 rounded">payroll.chain</code> and <code className="bg-emerald-100 px-1 rounded">payroll.currency</code> from your ENS text records.
                                            You own your payroll data.
                                        </p>
                                    </div>

                                    {isEditing ? (
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleSave}
                                                disabled={savingText}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 py-6 text-lg"
                                            >
                                                {savingText ? (
                                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                ) : (
                                                    <Save className="w-5 h-5 mr-2" />
                                                )}
                                                Save to ENS
                                            </Button>
                                            <Button
                                                onClick={() => setIsEditing(false)}
                                                variant="outline"
                                                className="py-6"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleStartEdit}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 py-6 text-lg"
                                        >
                                            Edit Configuration
                                        </Button>
                                    )}
                                </div>
                            ) : pendingPrimaryName ? (
                                // User has minted a subdomain but needs to set Primary Name
                                <div className="space-y-6">
                                    <div className="p-4 bg-violet-50 rounded-xl border border-violet-200 text-violet-900 text-sm">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-6 h-6 text-violet-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-base text-violet-800">Subdomain Created!</p>
                                                <p className="mt-1">
                                                    You now own <strong className="font-mono">{pendingPrimaryName}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white">
                                        <h4 className="font-bold text-lg mb-3">⚡ One More Step: Set Primary Name</h4>
                                        <p className="text-slate-300 text-sm mb-4">
                                            To complete your identity setup, you need to set this name as your <strong>Primary Name</strong> on the ENS App.
                                            This allows the blockchain to recognize your address by this name.
                                        </p>

                                        <div className="rounded-lg overflow-hidden border border-slate-600 mb-4">
                                            <img
                                                src={PRIMARY_NAME_GUIDE_IMAGE}
                                                alt="How to set Primary Name on ENS"
                                                className="w-full object-contain"
                                            />
                                        </div>

                                        <ol className="text-sm text-slate-300 space-y-2 mb-6 list-decimal list-inside">
                                            <li>Click the button below to open the ENS App</li>
                                            <li>Connect your wallet (same one as here)</li>
                                            <li>Find the "Primary Name" dropdown and select <strong className="text-white">{pendingPrimaryName}</strong></li>
                                            <li>Confirm the transaction in your wallet</li>
                                        </ol>

                                        <div className="flex flex-col gap-3">
                                            <a
                                                href={`https://sepolia.app.ens.domains/${pendingPrimaryName}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full"
                                            >
                                                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white py-5 text-base">
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Open ENS App
                                                </Button>
                                            </a>
                                            <Button
                                                variant="outline"
                                                onClick={handleConfirmPrimarySet}
                                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white py-5"
                                            >
                                                I've set my Primary Name
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // User has NO ENS and no pending - Show subdomain minting
                                <div className="space-y-6">
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-sm flex gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium">No ENS name detected</p>
                                            <p className="text-amber-800 mt-1">
                                                Claim a free <strong>{PARENT_DOMAIN}</strong> subdomain to configure your payroll preferences.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-slate-700">Choose your subdomain</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="yourname"
                                                value={subdomainLabel}
                                                onChange={(e) => setSubdomainLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                className="flex-1"
                                            />
                                            <span className="flex items-center px-4 bg-slate-100 rounded-lg border text-slate-600 font-mono text-sm">
                                                .{PARENT_DOMAIN}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Only lowercase letters, numbers, and hyphens. 3-32 characters.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleMintSubdomain}
                                        disabled={minting || subdomainLabel.length < 3}
                                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 py-6 text-lg"
                                    >
                                        {minting ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 mr-2" />
                                        )}
                                        Claim Subdomain
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
