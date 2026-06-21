import { useAuth } from '@/lib/AuthContext';
import { useClubContext } from '@/lib/useClubContext';

const DIAGNOSTIC_ROLES = new Set(['owner', 'admin']);

export function diagnosticsVisible({ isDev = false, memberRole = null, appRole = null } = {}) {
  return isDev === true || appRole === 'admin' || DIAGNOSTIC_ROLES.has(memberRole);
}

export default function useDiagnosticsVisible() {
  const { user } = useAuth();
  const { memberRole } = useClubContext();
  return diagnosticsVisible({
    isDev: import.meta.env.DEV === true,
    memberRole,
    appRole: user?.role,
  });
}
