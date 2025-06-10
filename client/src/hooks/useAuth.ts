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
  const response = await apiClient.get('/api/auth/user');
  return response.data;
};

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchAuthUser, // Esta função estava faltando!
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Evita refetch desnecessário
  });

  return {
    user: user as AuthUser | undefined,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}