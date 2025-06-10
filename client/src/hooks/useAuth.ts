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
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchAuthUser,
    retry: (failureCount, error: any) => {
      console.log(`🔄 Auth query retry attempt ${failureCount}:`, error?.response?.status);
      // Não retry em 401 (não autenticado)
      if (error?.response?.status === 401) {
        console.log('❌ 401 error - not retrying');
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  console.log('🔍 useAuth state:', {
    hasUser: !!user,
    isLoading,
    hasError: !!error,
    errorStatus: error?.response?.status,
    isAuthenticated: !!user && !error
  });

  return {
    user: user as AuthUser | undefined,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
    refetch
  };
}