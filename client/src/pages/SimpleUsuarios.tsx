import React from 'react';

export default function SimpleUsuarios() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gestão de Usuários</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Gerencie usuários e permissões do sistema.</p>
          <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Novo Usuário
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nome</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Perfil</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">João Silva</td>
                <td className="py-3">joao@empresa.com</td>
                <td className="py-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    Administrador
                  </span>
                </td>
                <td className="py-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Ativo
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Desativar
                    </button>
                  </div>
                </td>
              </tr>
              
              <tr className="border-b">
                <td className="py-3">Maria Santos</td>
                <td className="py-3">maria@empresa.com</td>
                <td className="py-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Gerente
                  </span>
                </td>
                <td className="py-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Ativo
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Desativar
                    </button>
                  </div>
                </td>
              </tr>
              
              <tr className="border-b">
                <td className="py-3">Pedro Costa</td>
                <td className="py-3">pedro@empresa.com</td>
                <td className="py-3">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    Motorista
                  </span>
                </td>
                <td className="py-3">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                    Inativo
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Editar
                    </button>
                    <button className="text-green-600 hover:text-green-800 text-sm">
                      Ativar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Administradores</h3>
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="text-sm text-blue-600">Acesso total ao sistema</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Gerentes</h3>
            <p className="text-2xl font-bold text-green-600">1</p>
            <p className="text-sm text-green-600">Permissões de gestão</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Motoristas</h3>
            <p className="text-2xl font-bold text-yellow-600">1</p>
            <p className="text-sm text-yellow-600">Acesso básico</p>
          </div>
        </div>
      </div>
    </div>
  );
}
