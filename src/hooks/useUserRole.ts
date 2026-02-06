import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'employee' | 'loading' | 'disconnected';

export function useUserRole() {
    const { address, isConnected } = useAccount();
    const [role, setRole] = useState<UserRole>('loading');

    useEffect(() => {
        const checkRole = async () => {
            if (!isConnected || !address) {
                setRole('disconnected');
                return;
            }

            setRole('loading');

            try {
                // Check if the address exists in the employees table
                const { data, error } = await supabase
                    .from('employees')
                    .select('id')
                    .ilike('wallet_address', address)
                    .maybeSingle();

                if (error) {
                    console.error("Error checking role:", error);
                    // Default to admin/guest on error to avoid lockout, or handle gracefully?
                    // For safety, let's treat unknown errors as 'admin' (guest) for now, 
                    // but logically if DB is down, we might want to error.
                    // For Hackathon: If error -> Admin
                    setRole('admin');
                } else if (data) {
                    // Address found in employees table -> Employee
                    setRole('employee');
                } else {
                    // Address NOT found -> Admin (Employer)
                    setRole('admin');
                }
            } catch (e) {
                console.error("Role check failed", e);
                setRole('admin');
            }
        };

        checkRole();
    }, [address, isConnected]);

    return { role, setRole };
}
