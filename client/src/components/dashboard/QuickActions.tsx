import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Car,
  User,
  Droplet,
  Wrench,
  Map,
  ClipboardList,
  Users,
  Clock,
  AlertTriangle
} from "lucide-react";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

function QuickAction({ icon, label, onClick, color = "bg-blue-500" }: QuickActionProps) {
  return (
    <Button
      variant="ghost"
      className="flex flex-col items-center justify-center h-24 w-full text-center rounded-lg transition-all hover:scale-105"
      onClick={onClick}
    >
      <div className={`${color} p-3 rounded-full mb-2 text-white`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}

export function QuickActions() {
  const [_, setLocation] = useLocation();
  
  const navigate = (path: string) => {
    setLocation(path);
  };

  const actions = [
    {
      icon: <Droplet className="h-5 w-5" />,
      label: "Registrar Abastecimento",
      onClick: () => navigate("/registros?type=fuel"),
      color: "bg-blue-500"
    },
    {
      icon: <Wrench className="h-5 w-5" />,
      label: "Registrar Manutenção",
      onClick: () => navigate("/registros?type=maintenance"),
      color: "bg-amber-500"
    },
    {
      icon: <Map className="h-5 w-5" />,
      label: "Registrar Viagem",
      onClick: () => navigate("/registros?type=trip"),
      color: "bg-green-500"
    },
    {
      icon: <Car className="h-5 w-5" />,
      label: "Gerenciar Veículos",
      onClick: () => navigate("/vehicles"),
      color: "bg-purple-500"
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Gerenciar Motoristas",
      onClick: () => navigate("/drivers"),
      color: "bg-indigo-500"
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Novo Checklist",
      onClick: () => navigate("/checklists/new"),
      color: "bg-rose-500"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Histórico",
      onClick: () => navigate("/registros/history"),
      color: "bg-teal-500"
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      label: "Relatórios",
      onClick: () => navigate("/relatorios"),
      color: "bg-red-500"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Ações Rápidas</CardTitle>
        <CardDescription>
          Acesse rapidamente as funções mais usadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {actions.map((action, index) => (
            <QuickAction 
              key={index}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
              color={action.color}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}