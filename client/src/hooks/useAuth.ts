import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: {
    name: string;
    permissions: Record<string, boolean>;
  } | null; // Role can be null if not assigned or not found
}

// Função para buscar dados do usuário autenticado
const fetchAuthUser = async (): Promise<AuthUser> => {
  console.log('🔍 Fetching auth user...');
  const response = await apiClient.get('/api/auth/user');
  console.log('✅ Auth user fetched successfully:', response.data);
  return response.data;
};

export function useAuth() {
  // Authentication disabled - bypass authentication checks
  console.log('🔧 Auth disabled - bypassing authentication requirements');
  
  return {
    user: {
      id: '1',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      role: {
        name: 'admin',
        permissions: {
          dashboard: true,
          registrations: true,
          history: true,
          reports: true,
          checklists: true,
          settings: true,
          userManagement: true,
          vehicleManagement: true,
          driverManagement: true,
        },
      },
    },
    isLoading: false,
    isAuthenticated: true, // Always return true to bypass auth checks
    error: null,
    refetch: () => Promise.resolve()
  };
}