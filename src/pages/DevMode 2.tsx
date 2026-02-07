import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, ArrowLeft, Wallet } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useAccount } from 'wagmi';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function DevMode() {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();

    const selectRole = (role: 'admin' | 'employee') => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        localStorage.setItem('dev_role', role);
        if (role === 'admin') {
            navigate(ROUTE_PATHS.DASHBOARD);
        } else {
            navigate(ROUTE_PATHS.PORTAL);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(ROUTE_PATHS.HOME)}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>

                    <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-6 mb-8">
                        <h1 className="text-3xl font-bold text-yellow-900 mb-2">
                            🚧 Development Mode
                        </h1>
                        <p className="text-yellow-800 mb-3">
                            Select your role to test different features. This page only appears when <code className="bg-yellow-200 px-2 py-1 rounded">VITE_DEV_MODE=true</code>
                        </p>

                        {/* Wallet Connection Status */}
                        {!isConnected ? (
                            <div className="mt-4 pt-4 border-t border-yellow-300">
                                <p className="text-yellow-900 font-medium mb-3">
                                    ⚠️ Connect your wallet first to select a role
                                </p>
                                <Button
                                    onClick={() => connect({ connector: injected() })}
                                    className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Connect Wallet
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-yellow-300">
                                <p className="text-green-700 font-medium">
                                    ✅ Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Admin Card */}
                    <Card
                        className={`p-10 transition-all border-2 bg-white group ${isConnected
                                ? 'cursor-pointer hover:shadow-2xl hover:border-blue-500'
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                        onClick={() => selectRole('admin')}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="p-6 bg-blue-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-12 h-12 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">
                                Admin Dashboard
                            </h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Manage employees, process cross-chain payroll, view analytics, and configure treasury settings
                            </p>
                            <div className="space-y-2 text-sm text-slate-500 mb-6">
                                <div>✓ Employee Management</div>
                                <div>✓ Cross-Chain Payments</div>
                                <div>✓ Treasury Analytics</div>
                                <div>✓ Payment History</div>
                            </div>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
                                size="lg"
                            >
                                Enter as Admin
                            </Button>
                        </div>
                    </Card>

                    {/* Employee Card */}
                    <Card
                        className={`p-10 transition-all border-2 bg-white group ${isConnected
                                ? 'cursor-pointer hover:shadow-2xl hover:border-purple-500'
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                        onClick={() => selectRole('employee')}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="p-6 bg-purple-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-12 h-12 text-purple-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">
                                Employee Portal
                            </h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                View payment history, configure chain preferences, and invest your USDC into Aave for yield
                            </p>
                            <div className="space-y-2 text-sm text-slate-500 mb-6">
                                <div>✓ Payment History</div>
                                <div>✓ Chain Preferences</div>
                                <div>✓ Aave Investments</div>
                                <div>✓ ENS Configuration</div>
                            </div>
                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
                                size="lg"
                            >
                                Enter as Employee
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                        💡 <strong>Tip:</strong> You can switch roles anytime by coming back to this page
                    </p>
                </div>
            </div>
        </div>
    );
}
