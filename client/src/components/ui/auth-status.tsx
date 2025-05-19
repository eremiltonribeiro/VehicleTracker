import { Button } from "./button";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth, AuthUser } from "@/hooks/useAuth";
import { Skeleton } from "./skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

export function AuthStatus() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!isAuthenticated) {
    return (
      <Button 
        onClick={() => window.location.href = "/api/login"} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1 text-blue-900 border-blue-900 hover:bg-blue-100"
      >
        <LogIn className="w-4 h-4" />
        <span>Entrar</span>
      </Button>
    );
  }

  const userData = user as AuthUser;
  
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        {userData.profileImageUrl ? (
          <AvatarImage src={userData.profileImageUrl} alt={userData.email || ""} />
        ) : (
          <AvatarFallback className="bg-blue-800 text-white">
            {userData.email ? userData.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </AvatarFallback>
        )}
      </Avatar>
      <Button 
        onClick={() => window.location.href = "/api/logout"} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1 text-red-700 border-red-700 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4" />
        <span>Sair</span>
      </Button>
    </div>
  );
}