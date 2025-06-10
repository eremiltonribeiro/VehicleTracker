import axios from "axios";
import { toast } from "@/hooks/use-toast";

// Criar instância do axios
export const apiClient = axios.create({
  baseURL: "/",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag para evitar múltiplos redirecionamentos
let isRedirecting = false;
let redirectTimer: NodeJS.Timeout | null = null;

// Função para lidar com erro 401
const handleUnauthorized = (message?: string, errorCode?: string) => {
  if (isRedirecting) {
    console.log('⏸️ Redirecionamento já em andamento, ignorando...');
    return;
  }

  isRedirecting = true;
  console.log('🚪 Iniciando redirecionamento para login devido a 401');

  // Limpar qualquer estado de autenticação local se necessário
  try {
    localStorage.removeItem('auth-state');
    sessionStorage.clear();
  } catch (e) {
    console.warn('Warning: Could not clear storage:', e);
  }

  // Cancelar timer anterior se existir
  if (redirectTimer) {
    clearTimeout(redirectTimer);
  }

  // Redirecionar para o endpoint de login do servidor
  redirectTimer = setTimeout(() => {
    console.log('🔄 Executando redirecionamento para /api/login');
    window.location.href = '/api/login';
  }, 500);
};

// Interceptor de resposta para lidar com erros
apiClient.interceptors.response.use(
  (response) => {
    // Reset flag em respostas bem-sucedidas
    if (response.status === 200 && response.config.url?.includes('/api/auth/user')) {
      isRedirecting = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const responseData = error.response?.data;
    const serverMessage = responseData?.message || 'Ocorreu um erro desconhecido.';
    const errorCode = responseData?.code;

    console.log(`❌ API Error - Status: ${status}, URL: ${requestUrl}`, {
      message: serverMessage,
      errorCode,
      isRedirecting
    });

    if (status === 401) {
      if (requestUrl.endsWith('/api/auth/user')) {
        console.warn(`🔐 Auth endpoint returned 401 - user not authenticated`);
        // Para o endpoint de auth, não fazemos redirecionamento automático
        // Deixamos o useAuth lidar com isso
        if (errorCode) {
          (window as any).__lastAuthErrorCode = errorCode;
        }
      } else if (requestUrl.includes('/api/login') || requestUrl.includes('/api/callback')) {
        console.warn(`🔐 Login/callback endpoint returned 401`);
        // Endpoints de login/callback podem retornar 401 durante o fluxo normal
      } else {
        // Outros endpoints recebendo 401 = sessão expirada
        console.error('🚨 401 Unauthorized for general API request. Session expired.');

        if (!isRedirecting) {
          toast({
            title: "Sessão Expirada",
            description: serverMessage || "Sua sessão expirou. Você será redirecionado para o login.",
            variant: "destructive",
            duration: 3000,
          });

          setTimeout(() => {
            handleUnauthorized(serverMessage, errorCode);
          }, 1000);
        }
      }
    } else if (status >= 500) {
      // Erros de servidor
      console.error(`🔥 Server Error ${status}:`, serverMessage);
      toast({
        title: "Erro do Servidor",
        description: "Ocorreu um erro interno. Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 5000,
      });
    } else if (status >= 400) {
      // Outros erros de cliente
      console.warn(`⚠️ Client Error ${status}:`, serverMessage);
      if (status !== 401) { // Já tratamos 401 acima
        toast({
          title: "Erro",
          description: serverMessage,
          variant: "destructive",
          duration: 4000,
        });
      }
    }

    return Promise.reject(error);
  }
);

// Interceptor de requisição para logs e reset de flags
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);

    // Reset flag de redirecionamento em novas requisições (exceto auth)
    if (config.url && !config.url.includes('/api/auth') && !config.url.includes('/api/login')) {
      if (isRedirecting) {
        console.log('🔄 Resetting redirect flag for new non-auth request');
        isRedirecting = false;
        if (redirectTimer) {
          clearTimeout(redirectTimer);
          redirectTimer = null;
        }
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;