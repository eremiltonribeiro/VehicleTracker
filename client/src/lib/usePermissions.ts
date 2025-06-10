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
  // Authentication disabled - grant all permissions
  const allPermissions = {
    dashboard: true,
    registrations: true,
    history: true,
    reports: true,
    checklists: true,
    settings: true,
    userManagement: true,
    vehicleManagement: true,
    driverManagement: true,
    fuelManagement: true,
    maintenanceManagement: true,
    reportAccess: true,
    isAdmin: true
  };

  // Verificar se o usuário tem permissão para uma funcionalidade específica
  const hasPermission = (permissionKey: keyof typeof defaultPermissions | string): boolean => {
    return true; // Always return true since authentication is disabled
  };
  
  return {
    permissions: allPermissions, // Grant all permissions
    hasPermission, // Function to check a specific permission - always returns true
    isLoading: false, // Never loading since auth is disabled
  };
}