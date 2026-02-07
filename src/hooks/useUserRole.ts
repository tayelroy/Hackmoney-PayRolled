import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'employee' | 'unauthorized' | 'loading' | 'disconnected';

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

            // Development Mode: Check localStorage for role selection
            if (import.meta.env.VITE_DEV_MODE === 'true') {
                const savedRole = localStorage.getItem('dev_role') as 'admin' | 'employee' | null;
                const devRole = savedRole || 'admin';
                console.warn('🚧 DEV MODE ACTIVE: Using role', devRole);
                setRole(devRole);
                return;
            }

            try {
                // 1. Check if Admin
                const { data: adminData, error: adminError } = await supabase
                    .from('admins')
                    .select('id')
                    .ilike('wallet_address', address)
                    .maybeSingle();

                if (adminData) {
                    setRole('admin');
                    return;
                }

                // 2. Check if Employee
                const { data: empData, error: empError } = await supabase
                    .from('employees')
                    .select('id')
                    .ilike('wallet_address', address)
                    .maybeSingle();

                if (empData) {
                    setRole('employee');
                    return;
                }

                // 3. Neither -> Unauthorized
                console.warn(`Wallet ${address} is not an Admin or Employee.`);
                setRole('unauthorized');

            } catch (e) {
                console.error("Role check failed", e);
                setRole('unauthorized');
            }
        };

        checkRole();
    }, [address, isConnected]);

    return { role, setRole, isDevMode: import.meta.env.VITE_DEV_MODE === 'true' };
}
