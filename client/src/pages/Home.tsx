import { useEffect } from "react";
import { RegistrationForm } from "@/components/vehicles/RegistrationForm";
import { HistoryView } from "@/components/vehicles/HistoryView";
import { Header } from "@/components/vehicles/Header";
import { useLocation } from "wouter";

export default function Home() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const view = searchParams.get("view");
  
  // Show registration form by default or history if specified in URL
  const showHistory = view === "history";
  
  return (
    <div id="app-container" className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
        {showHistory ? <HistoryView /> : <RegistrationForm />}
      </main>
    </div>
  );
}
