import React from 'react';

export default function SimpleConfiguracoes() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-6">Configure as preferências do sistema.</p>
        
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Configurações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Digite o nome da empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Configurações de Notificação</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Notificar sobre manutenções próximas</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Notificar sobre vencimento de documentos</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Enviar relatórios por email</span>
              </label>
            </div>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Configurações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuso Horário
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>America/Sao_Paulo</option>
                  <option>America/Rio_Branco</option>
                  <option>America/Manaus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moeda
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Real (R$)</option>
                  <option>Dólar (US$)</option>
                  <option>Euro (€)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Backup e Dados</h3>
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Fazer Backup
              </button>
              <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                Importar Dados
              </button>
              <button className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">
                Limpar Cache
              </button>
            </div>
          </div>
          
          <div className="pt-4">
            <button className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium">
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
