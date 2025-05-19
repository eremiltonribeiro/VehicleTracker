import { Link, useLocation } from "wouter";
import { Plus, History, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [location, setLocation] = useLocation();

  const isHistory = location.includes("history");

  return (
    <header className="bg-primary-800 text-white shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <h1 className="text-xl font-bold">Sistema de Gestão de Frota</h1>
        </div>
        <div className="flex items-center space-x-4">
          {isHistory ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              className="text-white hover:bg-primary-700 rounded-full"
            >
              <Plus className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/?view=history")}
              className="text-white hover:bg-primary-700 rounded-full"
            >
              <History className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
