import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/app-theme.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Função para registrar o Service Worker com melhor controle
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registrado:', registration.scope);

          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('📦 Nova versão disponível');

                  // Notificar usuário sobre atualização de forma mais suave
                  const shouldUpdate = window.confirm(
                    'Uma nova versão do aplicativo está disponível. Deseja atualizar agora?'
                  );

                  if (shouldUpdate) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Verificar se há uma atualização disponível a cada 30 minutos
          setInterval(() => {
            registration.update();
          }, 30 * 60 * 1000);
        })
        .catch(error => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });

      // Listener para quando o Service Worker for atualizado
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('🔄 Service Worker atualizado, recarregando...');
          window.location.reload();
        }
      });
    });
  } else {
    console.warn('⚠️ Service Worker não é suportado neste navegador');
  }
}

// Função para debug - REMOVER EM PRODUÇÃO
function setupDebug() {
  console.log('🚀 Iniciando aplicação...');
  console.log('📍 URL:', window.location.href);
  console.log('🌐 Online:', navigator.onLine);

  // Verificar se o DOM está pronto
  const root = document.getElementById("root");
  if (!root) {
    console.error('❌ Elemento root não encontrado!');
    return false;
  }

  console.log('✅ Elemento root encontrado');
  return true;
}

// Função principal para inicializar a aplicação
function initializeApp() {
  try {
    const rootElement = document.getElementById("root");

    if (!rootElement) {
      throw new Error("Elemento root não encontrado no DOM");
    }

    const root = createRoot(rootElement);

    root.render(
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    );

    console.log('✅ React inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar React:', error);

    // Mostrar erro na tela
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <h1 style="color: #dc2626;">Erro ao carregar aplicação</h1>
          <p>Por favor, recarregue a página ou limpe o cache do navegador.</p>
          <pre style="background: #fee; padding: 10px; margin-top: 10px; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
          </pre>
          <button 
            onclick="location.reload()" 
            style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Recarregar Página
          </button>
        </div>
      `;
    }
  }
}

// OPCIONAL: Desabilitar Service Worker para debug
// Descomente as linhas abaixo se quiser testar sem Service Worker
/*
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    console.log('⚠️ Service Worker desabilitado para debug');
  });
}
*/

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (setupDebug()) {
      initializeApp();
      registerServiceWorker();
    }
  });
} else {
  // DOM já está pronto
  if (setupDebug()) {
    initializeApp();
    registerServiceWorker();
  }
}