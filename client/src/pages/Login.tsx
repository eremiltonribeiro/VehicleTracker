import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { brandColors } from "@/lib/colors";
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Verificar se há erro na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error === 'auth_failed') {
      setLoginError('Falha na autenticação. Tente novamente.');
    } else if (error) {
      setLoginError(`Erro: ${error}`);
    }
  }, []);

  // Redirecionar para a página principal se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('✅ Usuário já autenticado, redirecionando para dashboard');
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleReplitLogin = () => {
    console.log('🔐 Iniciando login com Replit...');
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      // Redirecionar para o endpoint de login do servidor
      window.location.href = "/api/login";
    } catch (error) {
      console.error('❌ Erro ao iniciar login:', error);
      setLoginError('Erro ao iniciar processo de login');
      setIsLoggingIn(false);
    }
  };

  // Se já está autenticado, mostrar loading
  if (isAuthenticated && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="max-w-md w-full shadow-lg border-t-4" style={{ borderTopColor: brandColors.navyBlue }}>
        <CardHeader className="space-y-3">
          <div className="mx-auto text-center">
            <img 
              src="/logo-granduvale.svg" 
              alt="Granduvale Mineração" 
              className="h-24 mx-auto mb-2"
              onError={(e) => {
                console.warn('Logo não encontrada, usando placeholder');
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-xl text-center text-blue-900">
            Sistema de Gestão de Frota
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Acesse sua conta utilizando sua identidade Replit para gerenciar a frota.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Mostrar erro se houver */}
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          {/* Mostrar loading durante autenticação inicial */}
          {isLoading && (
            <Alert className="mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Verificando autenticação...</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleReplitLogin}
            disabled={isLoading || isLoggingIn}
            className="w-full bg-blue-800 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Entrar com Replit
              </>
            )}
          </Button>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Ao fazer login, você concorda com nossos termos de uso.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-gray-500 pt-8">
          <div className="text-center">
            <p>Login seguro e simplificado via Replit.</p>
            <p className="text-xs mt-1">
              Desenvolvido por {" "}
              <span className="font-medium text-blue-700">Granduvale Mineração</span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}