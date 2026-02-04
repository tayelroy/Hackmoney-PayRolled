import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard, 
  Lock, 
  Key,
  Smartphone
} from "lucide-react";

const Settings = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's treasury profile, payroll preferences, and security protocols.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Organization Profile */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Organization Profile</CardTitle>
                  <CardDescription>Public identity of your treasury on the Arc network.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Company Name</Label>
                  <Input 
                    id="org-name" 
                    placeholder="Acme Web3 Corp" 
                    defaultValue="Arc Treasury Systems"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-ens">ENS / Identity Handle</Label>
                  <Input 
                    id="org-ens" 
                    placeholder="company.eth" 
                    defaultValue="arctreasury.eth"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Administrative Email</Label>
                  <Input 
                    id="org-email" 
                    type="email" 
                    placeholder="ops@company.com" 
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Primary Timezone</Label>
                  <Input 
                    id="timezone" 
                    placeholder="UTC +0" 
                    defaultValue="UTC -5 (EST)"
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Save Profile Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Configuration */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Payroll & Liquidity</CardTitle>
                  <CardDescription>Configure cross-chain execution and token preferences.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Automatic Liquidation</Label>
                    <p className="text-sm text-muted-foreground">
                      Instantly swap incoming treasury assets to USDC for scheduled payroll.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Gas Abstraction</Label>
                    <p className="text-sm text-muted-foreground">
                      Sponsor gas fees for employee withdrawal transactions on Arc Mainnet.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Multi-Chain Bridging</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow employees to receive funds on any LI.FI supported chain.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Security & Controls</CardTitle>
                  <CardDescription>Manage multi-sig thresholds and admin access.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20 text-center space-y-3">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Multi-sig wallet configurations and hardware key approvals are managed at the protocol level via the Arc Governance portal.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Open Governance Portal
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="secondary" className="flex items-center justify-center gap-2">
                  <Key className="h-4 w-4" />
                  API Access Keys
                </Button>
                <Button variant="secondary" className="flex items-center justify-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Two-Factor Auth
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Control how you receive treasury alerts and payroll updates.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer" htmlFor="notify-low-balance">Low Treasury Balance Alerts</Label>
                <Switch id="notify-low-balance" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer" htmlFor="notify-payroll-success">Payroll Success Confirmation</Label>
                <Switch id="notify-payroll-success" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer" htmlFor="notify-new-employee">New Employee Verification</Label>
                <Switch id="notify-new-employee" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-12 border-t border-border flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-primary font-bold">
            <CreditCard className="h-5 w-5" />
            <span>PayRolled</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 PayRolled Treasury Solutions. Operating on Arc Mainnet v2.4.0
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;