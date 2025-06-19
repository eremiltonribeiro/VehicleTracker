import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Debug() {
  const [location, setLocation] = useLocation();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p className="mb-4">Current location: <code>{location}</code></p>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Navigation</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => setLocation('/')}>
            Home (/)
          </Button>
          
          <Button onClick={() => setLocation('/registros')}>
            Registros (/registros)
          </Button>
          
          <Button onClick={() => setLocation('/registros/history')}>
            History (/registros/history)
          </Button>
          
          <Button onClick={() => setLocation('/registros/dashboard')}>
            Dashboard (/registros/dashboard)
          </Button>
          
          <Button onClick={() => setLocation('/checklists')}>
            Checklists (/checklists)
          </Button>
          
          <Button onClick={() => setLocation('/relatorios')}>
            Relatórios (/relatorios)
          </Button>
          
          <Button onClick={() => setLocation('/cadastros')}>
            Cadastros (/cadastros)
          </Button>
          
          <Button onClick={() => setLocation('/configuracoes')}>
            Configurações (/configuracoes)
          </Button>
          
          <Button onClick={() => setLocation('/usuarios')}>
            Usuários (/usuarios)
          </Button>
          
          <Button onClick={() => setLocation('/test-404')}>
            Test 404 (/test-404)
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">System Info</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</p>
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>React Version:</strong> {React.version}</p>
        </div>
      </div>
    </div>
  );
}
