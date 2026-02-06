import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { ROUTE_PATHS } from '@/lib/index';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { role } = useUserRole();
    const navigate = useNavigate();

    useEffect(() => {
        if (role === 'loading') return;

        if (!allowedRoles.includes(role)) {
            // Redirect logic
            if (role === 'employee') {
                // Employees trying to access Admin pages -> Go to Portal
                navigate(ROUTE_PATHS.PORTAL, { replace: true });
            } else if (role === 'admin' || role === 'disconnected') {
                // Admins/Guests trying to access Employee pages -> Go to Dashboard (or Home)
                // If disconnected, useWallet handles the Home redirect usually, but let's be safe
                navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
            }
        }
    }, [role, allowedRoles, navigate]);

    if (role === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // If role is allowed, render children
    // Note: We might render momentarily before redirect in strict mode, 
    // but the useEffect handles it fast. 
    // For stricter guarding, return null if !allowedRoles.includes(role)
    if (!allowedRoles.includes(role)) return null;

    return <>{children}</>;
}
