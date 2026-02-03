import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface AddEmployeeDialogProps {
    onSuccess: () => void;
}

export function AddEmployeeDialog({ onSuccess }: AddEmployeeDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        wallet_address: '',
        salary: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('employees')
                .insert([
                    {
                        name: formData.name,
                        wallet_address: formData.wallet_address,
                        salary: parseFloat(formData.salary),
                        status: 'Active'
                    }
                ]);

            if (error) throw error;

            toast.success("Employee added successfully");
            setOpen(false);
            setFormData({ name: '', wallet_address: '', salary: '' });
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to add employee");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                    <Plus className="h-4 w-4" />
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Enter the details of the team member you wish to onboard to the payroll system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="Alice Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wallet">Wallet Address (Arc)</Label>
                        <Input
                            id="wallet"
                            placeholder="0x..."
                            value={formData.wallet_address}
                            onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                            required
                            pattern="^0x[a-fA-F0-9]{40}$"
                            title="Must be a valid Ethereum address starting with 0x"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salary">Monthly Salary (USDC)</Label>
                        <Input
                            id="salary"
                            type="number"
                            step="0.01"
                            placeholder="5000.00"
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Employee
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
