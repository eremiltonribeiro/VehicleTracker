import React from 'react';

export default function SimpleReports() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-6">Sistema de relatórios da frota.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Relatório de Abastecimentos</h3>
            <p className="text-sm text-gray-600 mb-4">Resumo dos abastecimentos por período</p>
            <div className="space-y-2">
              <input type="date" className="w-full p-2 border rounded-md" />
              <input type="date" className="w-full p-2 border rounded-md" />
              <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                Gerar Relatório
              </button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Relatório de Manutenções</h3>
            <p className="text-sm text-gray-600 mb-4">Resumo das manutenções por período</p>
            <div className="space-y-2">
              <input type="date" className="w-full p-2 border rounded-md" />
              <input type="date" className="w-full p-2 border rounded-md" />
              <button className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
                Gerar Relatório
              </button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Relatório de Viagens</h3>
            <p className="text-sm text-gray-600 mb-4">Resumo das viagens por período</p>
            <div className="space-y-2">
              <input type="date" className="w-full p-2 border rounded-md" />
              <input type="date" className="w-full p-2 border rounded-md" />
              <button className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700">
                Gerar Relatório
              </button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Relatório Geral</h3>
            <p className="text-sm text-gray-600 mb-4">Relatório completo da frota</p>
            <div className="space-y-2">
              <select className="w-full p-2 border rounded-md">
                <option>Selecione o veículo...</option>
                <option>Todos os veículos</option>
                <option>Veículo 1</option>
                <option>Veículo 2</option>
              </select>
              <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
