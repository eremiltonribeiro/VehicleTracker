import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { brandColors } from "@/lib/colors";
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  // Local state for error/loading of Replit login initiation can be added if needed, but often not necessary
  // as it's a redirect.
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth(); // login function from useAuth is no longer used here
  // const { toast } = useToast(); // toast might not be needed if there's no form submission error to show

  // Redirecionar para a página principal se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleReplitLogin = () => {
    // Redirect to the backend endpoint that starts OIDC flow
    window.location.href = "/api/login";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="max-w-md w-full shadow-lg border-t-4" style={{ borderTopColor: brandColors.navyBlue }}>
        <CardHeader className="space-y-3">
          <div className="mx-auto text-center">
            <img 
              src="/logo-granduvale.svg" 
              alt="Granduvale Mineração" 
              className="h-24 mx-auto mb-2"
            />
          </div>
          <CardTitle className="text-xl text-center text-blue-900">Sistema de Gestão de Frota</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Acesse sua conta utilizando sua identidade Replit para gerenciar a frota.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6"> {/* Added padding top for spacing */}
          <Button
            onClick={handleReplitLogin}
            className="w-full bg-blue-800 hover:bg-blue-700 text-white"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Entrar com Replit
          </Button>
          {/* Any errors related to Replit login itself would typically be handled by redirection
              or error pages served by the backend during the OIDC flow. */}
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-gray-500 pt-8"> {/* Added padding top */}
          <div className="text-center">
            <p>Login seguro e simplificado via Replit.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}