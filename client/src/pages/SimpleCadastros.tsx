import React from 'react';

export default function SimpleCadastros() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Central de Cadastros</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-6">Gerencie veículos, motoristas e outros dados da frota.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Veículos</h3>
            <p className="text-sm text-gray-600 mb-4">Cadastro e gerenciamento de veículos</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mb-2">
              Novo Veículo
            </button>
            <button className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
              Listar Veículos
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Motoristas</h3>
            <p className="text-sm text-gray-600 mb-4">Cadastro e gerenciamento de motoristas</p>
            <button className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 mb-2">
              Novo Motorista
            </button>
            <button className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
              Listar Motoristas
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Postos de Combustível</h3>
            <p className="text-sm text-gray-600 mb-4">Cadastro de postos e preços</p>
            <button className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 mb-2">
              Novo Posto
            </button>
            <button className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
              Listar Postos
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Tipos de Combustível</h3>
            <p className="text-sm text-gray-600 mb-4">Gerenciar tipos de combustível</p>
            <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 mb-2">
              Novo Tipo
            </button>
            <button className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
              Listar Tipos
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Tipos de Manutenção</h3>
            <p className="text-sm text-gray-600 mb-4">Categorias de manutenção</p>
            <button className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 mb-2">
              Novo Tipo
            </button>
            <button className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
              Listar Tipos
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Fornecedores</h3>
            <p className="text-sm text-gray-600 mb-4">Cadastro de fornecedores</p>
            <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 mb-2">
              Novo Fornecedor
            </button>
            <button className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
              Listar Fornecedores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
