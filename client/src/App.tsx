import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Welcome from "@/pages/Welcome";
import { Navigation } from "@/components/vehicles/Navigation";
import { Header } from "@/components/vehicles/Header";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-4 pb-12">
        <Switch>
          <Route path="/" component={Welcome} />
          <Route path="/registros" component={Home} />
          <Route path="/configuracoes" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
