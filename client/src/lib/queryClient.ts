import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { syncManager } from '../services/syncManager';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Função para fazer requisições à API com suporte para offline
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const method = options.method || 'GET';
  let body = null;
  let files = null;

  // Extrai o body da requisição
  if (options.body) {
    if (options.body instanceof FormData) {
      // Se for FormData, extrai os arquivos e converte o resto para objeto
      const formData = options.body as FormData;
      const filesArray: File[] = [];
      let jsonData = {};

      // Extrai dados do FormData
      formData.forEach((value, key) => {
        if (value instanceof File) {
          filesArray.push(value);
        } else if (key === 'data' && typeof value === 'string') {
          try {
            jsonData = JSON.parse(value);
          } catch (e) {
            console.error('Erro ao parsear JSON dos dados:', e);
          }
        }
      });

      body = jsonData;
      files = filesArray.length > 0 ? filesArray : null;
    } else if (typeof options.body === 'string') {
      // Se for string, assume que é JSON
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = options.body;
      }
    } else {
      // Outros tipos
      body = options.body;
    }
  }

  // Intercepta a requisição com o syncManager
  return syncManager.interceptRequest(url, method, body, files);
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});