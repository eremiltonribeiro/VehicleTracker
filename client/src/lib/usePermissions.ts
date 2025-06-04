import { useAuth } from "@/hooks/useAuth"; // Assuming useAuth is in src/hooks

// Define a default empty permissions object
const defaultPermissions: Record<string, boolean> = {
  dashboard: false,
  registrations: false,
  history: false,
  reports: false,
  checklists: false,
  settings: false,
  userManagement: false,
  vehicleManagement: false,
  driverManagement: false,
  // Add any other specific permissions that might exist
};

// Hook personalizado para verificar permissões
export function usePermissions() {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();

  const permissions = authUser?.role?.permissions || defaultPermissions;
  const isLoading = isAuthLoading; // Permissions are loading if auth state is loading

  // Verificar se o usuário tem permissão para uma funcionalidade específica
  const hasPermission = (permissionKey: keyof typeof defaultPermissions | string): boolean => {
    if (isLoading || !authUser) {
      return false; // No permissions if loading or not authenticated
    }
    return permissions[permissionKey] || false;
  };
  
  return {
    permissions, // The full permissions object for the current user
    hasPermission, // Function to check a specific permission
    isLoading, // Boolean indicating if permissions are still loading (tied to auth loading)
    // Optionally, expose the role name if needed directly from here, though it's in authUser
    // roleName: authUser?.role?.name
  };
}