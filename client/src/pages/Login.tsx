import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { brandColors } from "@/lib/colors";
import { useNavigate } from "wouter";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Autenticação simples - em produção, seria feita via API
    setTimeout(() => {
      // Usuário e senha padrão para demonstração
      if (username === "admin" && password === "admin") {
        // Salvar estado de autenticação no localStorage
        localStorage.setItem("authenticated", "true");
        localStorage.setItem("user", JSON.stringify({
          name: "Administrador",
          role: "admin"
        }));
        
        // Redirecionar para a página principal
        navigate("/");
      } else {
        setError("Usuário ou senha incorretos");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="max-w-md w-full shadow-lg border-t-4" style={{ borderTopColor: brandColors.navyBlue }}>
        <CardHeader className="space-y-3">
          <div className="mx-auto text-center">
            <img 
              src="/logo-granduvale.png" 
              alt="Granduvale Mineração" 
              className="h-16 mx-auto mb-2"
            />
          </div>
          <CardTitle className="text-2xl text-center text-blue-900">Sistema de Gestão de Frota</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Acesse sua conta para gerenciar veículos, registros de abastecimento, manutenções e viagens.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input 
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <div className="text-center">
            <p>Usuário e senha padrão: <strong>admin</strong></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}