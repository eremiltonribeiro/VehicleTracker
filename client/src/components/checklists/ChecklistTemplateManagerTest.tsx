import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function ChecklistTemplateManagerTest() {
  console.log("ChecklistTemplateManagerTest rendering...");

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["/api/checklist-templates"],
    queryFn: async () => {
      console.log("Fetching templates...");
      const response = await fetch("/api/checklist-templates");
      if (!response.ok) throw new Error("Erro ao carregar templates");
      const data = await response.json();
      console.log("Templates loaded:", data);
      return data;
    },
  });

  console.log("Templates state:", { templates, isLoading, error });

  if (isLoading) return <div>Carregando templates...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Templates de Checklist (Teste)</h2>
      <div className="space-y-2">
        {templates.map((template: any) => (
          <div key={template.id} className="p-3 border rounded">
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
