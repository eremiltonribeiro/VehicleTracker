// client/src/lib/apiClient.ts
import axios, { AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';

const handleUnauthorized = (reasonMessage?: string, errorCode?: string) => {
  // Clear any potentially stale auth error code stored on window
  if ((window as any).__lastAuthErrorCode) {
    delete (window as any).__lastAuthErrorCode;
  }

  if (window.location.pathname !== '/login') {
    let redirectUrl = '/login?reason=' + encodeURIComponent(reasonMessage || 'session_expired');
    if (errorCode) {
      redirectUrl += `&code=${encodeURIComponent(errorCode)}`;
    }
    window.location.href = redirectUrl;
  }
};

const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<any>) => {
    if (error.response) {
      const responseData = error.response.data;
      const serverMessage = responseData?.message || 'Ocorreu um erro desconhecido.';
      const errorCode = responseData?.code;

      if (error.response.status === 401) {
        const requestUrl = error.config?.url || '';

        if (requestUrl.endsWith('/api/auth/user') || requestUrl.includes('/api/login')) {
          console.warn(`Auth endpoint ${requestUrl} returned 401. This should be handled by useAuth or login flow.`);
          if (requestUrl.endsWith('/api/auth/user') && errorCode) {
            (window as any).__lastAuthErrorCode = errorCode;
          }
        } else {
          console.error('Received 401 Unauthorized for general API request. Logging out.');
          toast({
            title: "Sessão Expirada",
            description: serverMessage || "Sua sessão expirou ou é inválida. Você será redirecionado para o login.",
            variant: "destructive",
            duration: 4000,
          });
          setTimeout(() => {
            handleUnauthorized(serverMessage, errorCode);
          }, 3000);
        }
      } else if (error.response.status === 403) {
        console.error('Received 403 Forbidden. Access denied.');
        toast({
          title: "Acesso Negado",
          description: serverMessage || "Você não tem permissão para realizar esta ação.",
          variant: "destructive"
        });
      } else if (error.response.status >= 500) {
        console.error('Received 5xx server error.');
        toast({
          title: "Erro no Servidor",
          description: serverMessage || "Ocorreu um erro inesperado no servidor. Por favor, tente novamente mais tarde.",
          variant: "destructive"
        });
      } else if (responseData && typeof responseData === 'object' && 'message' in responseData) {
        // Fallback for other client errors (4xx) that have a message structure
        console.warn(`Received ${error.response.status} error: ${serverMessage}`);
        toast({
            title: `Erro ${error.response.status}`,
            description: serverMessage,
            variant: "destructive"
        });
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
