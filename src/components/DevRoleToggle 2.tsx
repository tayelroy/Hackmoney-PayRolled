import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';

export function DevRoleToggle() {
    const { role, toggleRole, isDevMode } = useUserRole();

    if (!isDevMode || role === 'loading' || role === 'disconnected') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Button
                onClick={toggleRole}
                variant="outline"
                size="sm"
                className="shadow-lg bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
            >
                <UserCog className="mr-2 h-4 w-4" />
                Toggle: {role === 'admin' ? 'Switch to Employee' : 'Switch to Admin'}
            </Button>
        </div>
    );
}
