import React from 'react';

export function SimpleRegistrationForm() {
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Formulário de Registro</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Registro
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option value="">Selecione...</option>
              <option value="fuel">Abastecimento</option>
              <option value="maintenance">Manutenção</option>
              <option value="trip">Viagem</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Veículo
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option value="">Selecione um veículo...</option>
              <option value="1">Veículo 1 - ABC-1234</option>
              <option value="2">Veículo 2 - XYZ-5678</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motorista
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option value="">Selecione um motorista...</option>
              <option value="1">João Silva</option>
              <option value="2">Maria Santos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Digite observações..."
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Salvar Registro
          </button>
        </form>
      </div>
    </div>
  );
}
