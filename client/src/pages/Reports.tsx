import { ReportGenerator } from "@/components/vehicles/ReportGenerator";
import { Header } from "@/components/vehicles/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";

export default function Reports() {
  return (
    <div id="app-container" className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      {!navigator.onLine && (
        <div className="bg-yellow-100 px-4 py-1">
          <Alert className="border-yellow-500 bg-yellow-50">
            <WifiOff className="h-4 w-4 text-yellow-600 mr-2" />
            <AlertTitle>Modo Offline</AlertTitle>
            <AlertDescription>
              Você está trabalhando offline. Os relatórios podem ser gerados, mas com dados limitados.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
        <ReportGenerator />
      </main>
    </div>
  );
}