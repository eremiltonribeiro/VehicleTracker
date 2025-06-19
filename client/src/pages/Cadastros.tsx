import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, User, MapPin, Fuel, Wrench } from "lucide-react";
import { CadastroVeiculos } from "@/components/cadastros/CadastroVeiculos";
import { CadastroMotoristas } from "@/components/cadastros/CadastroMotoristas";
import { CadastroPostos } from "@/components/cadastros/CadastroPostos";
import { CadastroTiposCombustivel } from "@/components/cadastros/CadastroTiposCombustivel";
import { CadastroTiposManutencao } from "@/components/cadastros/CadastroTiposManutencao";

export default function Cadastros() {
  const [activeTab, setActiveTab] = useState("veiculos");

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cadastros</h1>
        <p className="text-gray-600 mt-2">Gerencie veículos, motoristas, postos e outros dados da frota</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="veiculos" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Veículos
          </TabsTrigger>
          <TabsTrigger value="motoristas" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Motoristas
          </TabsTrigger>
          <TabsTrigger value="postos" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Postos
          </TabsTrigger>
          <TabsTrigger value="combustiveis" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Combustíveis
          </TabsTrigger>
          <TabsTrigger value="manutencao" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Manutenção
          </TabsTrigger>
        </TabsList>

        <TabsContent value="veiculos" className="mt-6">
          <CadastroVeiculos />
        </TabsContent>

        <TabsContent value="motoristas" className="mt-6">
          <CadastroMotoristas />
        </TabsContent>

        <TabsContent value="postos" className="mt-6">
          <CadastroPostos />
        </TabsContent>

        <TabsContent value="combustiveis" className="mt-6">
          <CadastroTiposCombustivel />
        </TabsContent>

        <TabsContent value="manutencao" className="mt-6">
          <CadastroTiposManutencao />
        </TabsContent>
      </Tabs>
    </div>
  );
}
