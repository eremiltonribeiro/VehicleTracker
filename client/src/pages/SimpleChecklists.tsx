import React from 'react';

export default function SimpleChecklists() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Checklists</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">Sistema de checklists para veículos.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Checklist Diário</h3>
            <p className="text-sm text-gray-600 mb-4">Verificações diárias dos veículos</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              Novo Checklist
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Checklist Semanal</h3>
            <p className="text-sm text-gray-600 mb-4">Verificações semanais dos veículos</p>
            <button className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
              Ver Histórico
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Checklist Mensal</h3>
            <p className="text-sm text-gray-600 mb-4">Verificações mensais dos veículos</p>
            <button className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700">
              Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
