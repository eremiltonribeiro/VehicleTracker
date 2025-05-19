import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import multer from "multer";
import { z } from "zod";
import { extendedRegistrationSchema, fuelRegistrationSchema, maintenanceRegistrationSchema, tripRegistrationSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { DatabaseStorage } from "./dbStorage";

// Setup upload directory
const uploadsDir = path.join(process.cwd(), "dist/public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Configurar middleware para analisar diferentes tipos de corpo de requisição
import bodyParser from 'body-parser';

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar bodyParser antes de qualquer outra rota
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Configurar autenticação
  await setupAuth(app);
  
  // Endpoint para obter usuário atual
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ message: "Falha ao buscar usuário" });
    }
  });
  // API routes for vehicle management
  // Endpoints para veículos
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter veículo específico pelo ID
  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      res.json(vehicle);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Criar novo veículo
  app.post("/api/vehicles", upload.single("image"), async (req, res) => {
    try {
      const vehicleData = req.body;
      
      // Adicionar URL da imagem, se enviada
      if (req.file) {
        vehicleData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar veículo
  app.put("/api/vehicles/:id", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicleData = req.body;
      
      // Verificar se o veículo existe
      const existingVehicle = await storage.getVehicle(id);
      if (!existingVehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      // Adicionar URL da imagem, se enviada
      if (req.file) {
        vehicleData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      // Verificar se storage tem função de atualização
      if (typeof storage.updateVehicle === 'function') {
        const updatedVehicle = await storage.updateVehicle(id, vehicleData);
        return res.json(updatedVehicle);
      } else {
        // Tratamento alternativo para MemStorage que não tem updateVehicle
        const vehicles = await storage.getVehicles();
        const index = vehicles.findIndex((v: any) => v.id === id);
        
        if (index >= 0) {
          const updatedVehicle = { ...existingVehicle, ...vehicleData, id };
          vehicles[index] = updatedVehicle;
          
          // Se for DatabaseStorage, fazer update no banco (este código não será chamado)
          // Se for MemStorage, salvar no array em memória
          if (storage instanceof DatabaseStorage) {
            // Não será executado
          } else {
            // Para o MemStorage, salvar array atualizado
            await (storage as any).saveVehicles(vehicles);
          }
          
          return res.json(updatedVehicle);
        }
      }
      
      res.status(404).json({ message: "Não foi possível atualizar o veículo" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir veículo
  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o veículo existe
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      // Verificar se storage tem função de exclusão
      if (typeof storage.deleteVehicle === 'function') {
        await storage.deleteVehicle(id);
        return res.status(204).send();
      } else {
        // Tratamento alternativo para MemStorage que não tem deleteVehicle
        const vehicles = await storage.getVehicles();
        const updatedVehicles = vehicles.filter((v: any) => v.id !== id);
        
        // Se for DatabaseStorage, fazer delete no banco (este código não será chamado)
        // Se for MemStorage, salvar array atualizado
        if (storage instanceof DatabaseStorage) {
          // Não será executado
        } else {
          // Para o MemStorage, salvar array atualizado
          await (storage as any).saveVehicles(updatedVehicles);
        }
        
        return res.status(204).send();
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoints para motoristas
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter motorista específico pelo ID
  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driver = await storage.getDriver(id);
      
      if (!driver) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      res.json(driver);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Criar novo motorista
  app.post("/api/drivers", upload.single("image"), async (req, res) => {
    try {
      console.log("Recebendo request para criar motorista:", req.body);
      
      // Criar objeto com apenas os campos válidos do schema
      const driverData = {
        name: req.body.name,
        license: req.body.license,
        phone: req.body.phone
      };
      
      // Adicionar URL da imagem, se enviada
      if (req.file) {
        driverData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      console.log("Dados a serem salvos:", driverData);
      const driver = await storage.createDriver(driverData);
      console.log("Motorista criado com sucesso:", driver);
      
      res.status(201).json(driver);
    } catch (error: any) {
      console.error("Erro ao criar motorista:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir motorista
  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Excluindo motorista ID:", id);
      
      // Verificar se o motorista existe
      const existingDriver = await storage.getDriver(id);
      if (!existingDriver) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      // Excluir motorista
      const deleted = await storage.deleteDriver(id);
      if (deleted) {
        console.log("Motorista excluído com sucesso");
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ message: "Falha ao excluir motorista" });
      }
    } catch (error: any) {
      console.error("Erro ao excluir motorista:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar motorista
  app.put("/api/drivers/:id", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driverData = req.body;
      
      // Verificar se o motorista existe
      const existingDriver = await storage.getDriver(id);
      if (!existingDriver) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      // Adicionar URL da imagem, se enviada
      if (req.file) {
        driverData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      // Verificar se storage tem função de atualização
      if (typeof storage.updateDriver === 'function') {
        const updatedDriver = await storage.updateDriver(id, driverData);
        return res.json(updatedDriver);
      } else {
        // Tratamento alternativo para MemStorage que não tem updateDriver
        const drivers = await storage.getDrivers();
        const index = drivers.findIndex((d: any) => d.id === id);
        
        if (index >= 0) {
          const updatedDriver = { ...existingDriver, ...driverData, id };
          drivers[index] = updatedDriver;
          
          // Se for DatabaseStorage, fazer update no banco (este código não será chamado)
          // Se for MemStorage, salvar no array em memória
          if (storage instanceof DatabaseStorage) {
            // Não será executado
          } else {
            // Para o MemStorage, salvar array atualizado
            await (storage as any).saveDrivers(drivers);
          }
          
          return res.json(updatedDriver);
        }
      }
      
      res.status(404).json({ message: "Não foi possível atualizar o motorista" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir motorista
  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o motorista existe
      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Motorista não encontrado" });
      }
      
      // Verificar se storage tem função de exclusão
      if (typeof storage.deleteDriver === 'function') {
        await storage.deleteDriver(id);
        return res.status(204).send();
      } else {
        // Tratamento alternativo para MemStorage que não tem deleteDriver
        const drivers = await storage.getDrivers();
        const updatedDrivers = drivers.filter((d: any) => d.id !== id);
        
        // Se for DatabaseStorage, fazer delete no banco (este código não será chamado)
        // Se for MemStorage, salvar array atualizado
        if (storage instanceof DatabaseStorage) {
          // Não será executado
        } else {
          // Para o MemStorage, salvar array atualizado
          await (storage as any).saveDrivers(updatedDrivers);
        }
        
        return res.status(204).send();
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoints para postos de combustível
  app.get("/api/fuel-stations", async (req, res) => {
    try {
      const fuelStations = await storage.getFuelStations();
      res.json(fuelStations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter posto específico pelo ID
  app.get("/api/fuel-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const station = await storage.getFuelStation(id);
      
      if (!station) {
        return res.status(404).json({ message: "Posto não encontrado" });
      }
      
      res.json(station);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Criar novo posto
  app.post("/api/fuel-stations", async (req, res) => {
    try {
      const stationData = req.body;
      const station = await storage.createFuelStation(stationData);
      res.status(201).json(station);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar posto
  app.put("/api/fuel-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stationData = req.body;
      
      // Verificar se o posto existe
      const existingStation = await storage.getFuelStation(id);
      if (!existingStation) {
        return res.status(404).json({ message: "Posto não encontrado" });
      }
      
      // Verificar se storage tem função de atualização
      if (typeof (storage as any).updateFuelStation === 'function') {
        const updatedStation = await (storage as any).updateFuelStation(id, stationData);
        return res.json(updatedStation);
      } else {
        // Tratamento alternativo para MemStorage que não tem updateFuelStation
        const stations = await storage.getFuelStations();
        const index = stations.findIndex((s: any) => s.id === id);
        
        if (index >= 0) {
          const updatedStation = { ...existingStation, ...stationData, id };
          stations[index] = updatedStation;
          
          // Se for MemStorage, salvar array atualizado
          if (!(storage instanceof DatabaseStorage)) {
            await (storage as any).saveFuelStations(stations);
          }
          
          return res.json(updatedStation);
        }
      }
      
      res.status(404).json({ message: "Não foi possível atualizar o posto" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir posto
  app.delete("/api/fuel-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o posto existe
      const station = await storage.getFuelStation(id);
      if (!station) {
        return res.status(404).json({ message: "Posto não encontrado" });
      }
      
      // Verificar se storage tem função de exclusão
      if (typeof (storage as any).deleteFuelStation === 'function') {
        await (storage as any).deleteFuelStation(id);
        return res.status(204).send();
      } else {
        // Tratamento alternativo para MemStorage que não tem deleteFuelStation
        const stations = await storage.getFuelStations();
        const updatedStations = stations.filter((s: any) => s.id !== id);
        
        // Se for MemStorage, salvar array atualizado
        if (!(storage instanceof DatabaseStorage)) {
          await (storage as any).saveFuelStations(updatedStations);
        }
        
        return res.status(204).send();
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoints para tipos de combustível
  app.get("/api/fuel-types", async (req, res) => {
    try {
      const fuelTypes = await storage.getFuelTypes();
      res.json(fuelTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter tipo de combustível específico pelo ID
  app.get("/api/fuel-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fuelType = await storage.getFuelType(id);
      
      if (!fuelType) {
        return res.status(404).json({ message: "Tipo de combustível não encontrado" });
      }
      
      res.json(fuelType);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Criar novo tipo de combustível
  app.post("/api/fuel-types", async (req, res) => {
    try {
      const fuelTypeData = req.body;
      const fuelType = await storage.createFuelType(fuelTypeData);
      res.status(201).json(fuelType);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar tipo de combustível
  app.put("/api/fuel-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fuelTypeData = req.body;
      
      // Verificar se o tipo de combustível existe
      const existingFuelType = await storage.getFuelType(id);
      if (!existingFuelType) {
        return res.status(404).json({ message: "Tipo de combustível não encontrado" });
      }
      
      // Verificar se storage tem função de atualização
      if (typeof (storage as any).updateFuelType === 'function') {
        const updatedFuelType = await (storage as any).updateFuelType(id, fuelTypeData);
        return res.json(updatedFuelType);
      } else {
        // Tratamento alternativo para MemStorage que não tem updateFuelType
        const fuelTypes = await storage.getFuelTypes();
        const index = fuelTypes.findIndex((ft: any) => ft.id === id);
        
        if (index >= 0) {
          const updatedFuelType = { ...existingFuelType, ...fuelTypeData, id };
          fuelTypes[index] = updatedFuelType;
          
          // Se for MemStorage, salvar array atualizado
          if (!(storage instanceof DatabaseStorage)) {
            await (storage as any).saveFuelTypes(fuelTypes);
          }
          
          return res.json(updatedFuelType);
        }
      }
      
      res.status(404).json({ message: "Não foi possível atualizar o tipo de combustível" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir tipo de combustível
  app.delete("/api/fuel-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o tipo de combustível existe
      const fuelType = await storage.getFuelType(id);
      if (!fuelType) {
        return res.status(404).json({ message: "Tipo de combustível não encontrado" });
      }
      
      // Verificar se storage tem função de exclusão
      if (typeof (storage as any).deleteFuelType === 'function') {
        await (storage as any).deleteFuelType(id);
        return res.status(204).send();
      } else {
        // Tratamento alternativo para MemStorage que não tem deleteFuelType
        const fuelTypes = await storage.getFuelTypes();
        const updatedFuelTypes = fuelTypes.filter((ft: any) => ft.id !== id);
        
        // Se for MemStorage, salvar array atualizado
        if (!(storage instanceof DatabaseStorage)) {
          await (storage as any).saveFuelTypes(updatedFuelTypes);
        }
        
        return res.status(204).send();
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoints para tipos de manutenção
  app.get("/api/maintenance-types", async (req, res) => {
    try {
      const maintenanceTypes = await storage.getMaintenanceTypes();
      res.json(maintenanceTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter tipo de manutenção específico pelo ID
  app.get("/api/maintenance-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const maintenanceType = await storage.getMaintenanceType(id);
      
      if (!maintenanceType) {
        return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
      }
      
      res.json(maintenanceType);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Criar novo tipo de manutenção
  app.post("/api/maintenance-types", async (req, res) => {
    try {
      const maintenanceTypeData = req.body;
      const maintenanceType = await storage.createMaintenanceType(maintenanceTypeData);
      res.status(201).json(maintenanceType);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar tipo de manutenção
  app.put("/api/maintenance-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const maintenanceTypeData = req.body;
      
      // Verificar se o tipo de manutenção existe
      const existingMaintenanceType = await storage.getMaintenanceType(id);
      if (!existingMaintenanceType) {
        return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
      }
      
      // Verificar se storage tem função de atualização
      if (typeof (storage as any).updateMaintenanceType === 'function') {
        const updatedMaintenanceType = await (storage as any).updateMaintenanceType(id, maintenanceTypeData);
        return res.json(updatedMaintenanceType);
      } else {
        // Tratamento alternativo para MemStorage que não tem updateMaintenanceType
        const maintenanceTypes = await storage.getMaintenanceTypes();
        const index = maintenanceTypes.findIndex((mt: any) => mt.id === id);
        
        if (index >= 0) {
          const updatedMaintenanceType = { ...existingMaintenanceType, ...maintenanceTypeData, id };
          maintenanceTypes[index] = updatedMaintenanceType;
          
          // Se for MemStorage, salvar array atualizado
          if (!(storage instanceof DatabaseStorage)) {
            await (storage as any).saveMaintenanceTypes(maintenanceTypes);
          }
          
          return res.json(updatedMaintenanceType);
        }
      }
      
      res.status(404).json({ message: "Não foi possível atualizar o tipo de manutenção" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir tipo de manutenção
  app.delete("/api/maintenance-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o tipo de manutenção existe
      const maintenanceType = await storage.getMaintenanceType(id);
      if (!maintenanceType) {
        return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
      }
      
      // Verificar se storage tem função de exclusão
      if (typeof (storage as any).deleteMaintenanceType === 'function') {
        await (storage as any).deleteMaintenanceType(id);
        return res.status(204).send();
      } else {
        // Tratamento alternativo para MemStorage que não tem deleteMaintenanceType
        const maintenanceTypes = await storage.getMaintenanceTypes();
        const updatedMaintenanceTypes = maintenanceTypes.filter((mt: any) => mt.id !== id);
        
        // Se for MemStorage, salvar array atualizado
        if (!(storage instanceof DatabaseStorage)) {
          await (storage as any).saveMaintenanceTypes(updatedMaintenanceTypes);
        }
        
        return res.status(204).send();
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get registrations with optional filters
  app.get("/api/registrations", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const registrations = await storage.getRegistrations({
        type,
        vehicleId,
        startDate,
        endDate,
      });

      // Get additional data for each registration
      const registrationsWithDetails = await Promise.all(
        registrations.map(async (reg) => {
          const vehicle = await storage.getVehicle(reg.vehicleId);
          const driver = await storage.getDriver(reg.driverId);
          
          let fuelStation, fuelType, maintenanceType;
          
          if (reg.fuelStationId) {
            fuelStation = await storage.getFuelStation(reg.fuelStationId);
          }
          
          if (reg.fuelTypeId) {
            fuelType = await storage.getFuelType(reg.fuelTypeId);
          }
          
          if (reg.maintenanceTypeId) {
            maintenanceType = await storage.getMaintenanceType(reg.maintenanceTypeId);
          }
          
          return {
            ...reg,
            vehicle,
            driver,
            fuelStation,
            fuelType,
            maintenanceType,
          };
        })
      );

      res.json(registrationsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get single registration
  app.get("/api/registrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }

      const vehicle = await storage.getVehicle(registration.vehicleId);
      const driver = await storage.getDriver(registration.driverId);
      
      let fuelStation, fuelType, maintenanceType;
      
      if (registration.fuelStationId) {
        fuelStation = await storage.getFuelStation(registration.fuelStationId);
      }
      
      if (registration.fuelTypeId) {
        fuelType = await storage.getFuelType(registration.fuelTypeId);
      }
      
      if (registration.maintenanceTypeId) {
        maintenanceType = await storage.getMaintenanceType(registration.maintenanceTypeId);
      }
      
      res.json({
        ...registration,
        vehicle,
        driver,
        fuelStation,
        fuelType,
        maintenanceType,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new registration with file upload
  app.post("/api/registrations", upload.single("photo"), async (req, res) => {
    try {
      const registrationData = JSON.parse(req.body.data);

      // Convert string dates to Date objects
      if (registrationData.date) {
        registrationData.date = new Date(registrationData.date);
      }

      let schema;
      switch (registrationData.type) {
        case "fuel":
          schema = fuelRegistrationSchema;
          break;
        case "maintenance":
          schema = maintenanceRegistrationSchema;
          break;
        case "trip":
          schema = tripRegistrationSchema;
          break;
        default:
          schema = extendedRegistrationSchema;
      }

      // If a file was uploaded, add the URL to the registration data
      if (req.file) {
        registrationData.photoUrl = `/uploads/${req.file.filename}`;
      }

      // Validate data
      schema.parse(registrationData);

      // Create registration
      const registration = await storage.createRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
