import { DatabaseStorage } from "./dbStorage";

async function seedDatabase() {
  const storage = new DatabaseStorage();
  
  try {
    console.log("🌱 Starting database seeding...");
    
    // Create fuel types
    console.log("Creating fuel types...");
    await storage.createFuelType({ name: 'Gasolina Comum' });
    await storage.createFuelType({ name: 'Etanol' });
    await storage.createFuelType({ name: 'Diesel' });
    
    // Create fuel stations
    console.log("Creating fuel stations...");
    await storage.createFuelStation({ name: 'Posto Shell', address: 'Rua das Flores, 123' });
    await storage.createFuelStation({ name: 'Posto Petrobras', address: 'Av. Principal, 456' });
    await storage.createFuelStation({ name: 'Posto Ipiranga', address: 'Rua Central, 789' });
    
    // Create maintenance types
    console.log("Creating maintenance types...");
    await storage.createMaintenanceType({ name: 'Troca de Óleo' });
    await storage.createMaintenanceType({ name: 'Revisão Geral' });
    await storage.createMaintenanceType({ name: 'Troca de Pneus' });
    await storage.createMaintenanceType({ name: 'Alinhamento' });
    await storage.createMaintenanceType({ name: 'Balanceamento' });
    
    // Create drivers
    console.log("Creating drivers...");
    await storage.createDriver({ name: 'João Silva', license: '12345678901', phone: '(11) 99999-9999' });
    await storage.createDriver({ name: 'Maria Santos', license: '98765432109', phone: '(11) 88888-8888' });
    await storage.createDriver({ name: 'Pedro Costa', license: '11223344556', phone: '(11) 77777-7777' });
    
    // Create roles
    console.log("Creating roles...");
    await storage.createRole({ 
      name: 'Administrador', 
      description: 'Acesso total ao sistema', 
      permissions: JSON.stringify(['create', 'read', 'update', 'delete', 'manage_users'])
    });
    await storage.createRole({ 
      name: 'Motorista', 
      description: 'Acesso básico para motoristas', 
      permissions: JSON.stringify(['read', 'create_registrations'])
    });
    await storage.createRole({ 
      name: 'Supervisor', 
      description: 'Supervisão de operações', 
      permissions: JSON.stringify(['read', 'update', 'create_registrations', 'view_reports'])
    });
    
    console.log("✅ Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();