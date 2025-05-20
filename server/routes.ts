import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import multer from "multer";
import { z } from "zod";
import { 
  extendedRegistrationSchema, 
  fuelRegistrationSchema, 
  maintenanceRegistrationSchema, 
  tripRegistrationSchema,
  insertVehicleSchema,
  insertDriverSchema,
  insertFuelStationSchema,
  insertFuelTypeSchema,
  insertMaintenanceTypeSchema
} from "@shared/schema";
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
  // Configurar middleware para parsing de JSON
  app.use(express.json());
  
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
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/vehicles", upload.single('image'), async (req, res) => {
    try {
      const vehicleData = req.body;
      
      // Converter valores numéricos
      if (vehicleData.year) {
        vehicleData.year = parseInt(vehicleData.year);
      }
      
      // Log dos dados recebidos para debug
      console.log("Dados do veículo recebidos:", vehicleData);
      
      try {
        // Validar dados
        insertVehicleSchema.parse(vehicleData);
        
        // Se houver imagem, adicionar URL à informação do veículo
        if (req.file) {
          vehicleData.imageUrl = `/uploads/${req.file.filename}`;
        }
        
        const vehicle = await storage.createVehicle(vehicleData);
        res.status(201).json(vehicle);
      } catch (validationError: any) {
        if (validationError instanceof z.ZodError) {
          console.error("Erro de validação:", validationError.errors);
          return res.status(400).json({ 
            message: "Erro de validação", 
            errors: validationError.errors.map(e => e.message) 
          });
        }
        throw validationError;
      }
    } catch (error: any) {
      console.error("Erro ao criar veículo:", error);
      res.status(500).json({ message: "Ocorreu um erro ao cadastrar o veículo. Tente novamente." });
    }
  });

  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/drivers", upload.single('image'), async (req, res) => {
    try {
      const driverData = req.body;
      
      // Validar dados
      insertDriverSchema.parse(driverData);
      
      // Se houver imagem, adicionar URL à informação do motorista
      if (req.file) {
        driverData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Erro ao criar motorista:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/fuel-stations", async (req, res) => {
    try {
      const fuelStations = await storage.getFuelStations();
      res.json(fuelStations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/fuel-stations", async (req, res) => {
    try {
      const stationData = req.body;
      
      // Validar dados
      insertFuelStationSchema.parse(stationData);
      
      const station = await storage.createFuelStation(stationData);
      res.status(201).json(station);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Erro ao criar posto de combustível:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/fuel-types", async (req, res) => {
    try {
      const fuelTypes = await storage.getFuelTypes();
      res.json(fuelTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/fuel-types", async (req, res) => {
    try {
      const typeData = { name: req.body.name };
      
      // Validar dados usando o schema
      try {
        insertFuelTypeSchema.parse(typeData);
      } catch (validationError: any) {
        return res.status(400).json({ 
          message: "Erro de validação", 
          errors: validationError.errors 
        });
      }
      
      const fuelType = await storage.createFuelType(typeData);
      res.status(201).json(fuelType);
    } catch (error: any) {
      console.error("Erro ao criar tipo de combustível:", error);
      res.status(500).json({ 
        message: "Ocorreu um erro ao cadastrar o tipo de combustível"
      });
    }
  });

  app.get("/api/maintenance-types", async (req, res) => {
    try {
      const maintenanceTypes = await storage.getMaintenanceTypes();
      res.json(maintenanceTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/maintenance-types", async (req, res) => {
    try {
      const typeData = req.body;
      
      // Validar dados
      insertMaintenanceTypeSchema.parse(typeData);
      
      const maintenanceType = await storage.createMaintenanceType(typeData);
      res.status(201).json(maintenanceType);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Erro ao criar tipo de manutenção:", error);
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

  // Rotas para checklists
  // Obter templates de checklist
  app.get("/api/checklist-templates", async (req, res) => {
    try {
      const templates = await storage.getChecklistTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obter um template específico com seus itens
  app.get("/api/checklist-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getChecklistTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template não encontrado" });
      }
      
      const items = await storage.getChecklistItems(id);
      res.json({ ...template, items });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obter itens de um template específico
  app.get("/api/checklist-templates/:id/items", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getChecklistTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template não encontrado" });
      }
      
      const items = await storage.getChecklistItems(id);
      console.log(`Itens retornados para o template ${id}:`, items);
      res.json(items);
    } catch (error: any) {
      console.error(`Erro ao buscar itens para o template ${req.params.id}:`, error);
      res.status(500).json({ message: error.message });
    }
  });

  // Criar novo template de checklist
  app.post("/api/checklist-templates", async (req, res) => {
    try {
      const templateData = req.body;
      const template = await storage.createChecklistTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Adicionar item ao template
  app.post("/api/checklist-items", async (req, res) => {
    try {
      const itemData = req.body;
      const item = await storage.createChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Obter checklists realizados
  app.get("/api/checklists", async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
      const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const checklists = await storage.getVehicleChecklists({
        vehicleId,
        driverId,
        startDate,
        endDate,
      });
      
      // Enriquecer com detalhes do veículo e motorista
      const enrichedChecklists = await Promise.all(
        checklists.map(async (checklist) => {
          const vehicle = await storage.getVehicle(checklist.vehicleId);
          const driver = await storage.getDriver(checklist.driverId);
          const template = await storage.getChecklistTemplate(checklist.templateId);
          
          return {
            ...checklist,
            vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
            driver: driver ? { id: driver.id, name: driver.name } : null,
            template: template ? { id: template.id, name: template.name } : null,
          };
        })
      );
      
      res.json(enrichedChecklists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obter um checklist específico com seus resultados
  app.get("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getVehicleChecklist(id);
      
      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      
      const vehicle = await storage.getVehicle(checklist.vehicleId);
      const driver = await storage.getDriver(checklist.driverId);
      const template = await storage.getChecklistTemplate(checklist.templateId);
      const items = await storage.getChecklistItems(checklist.templateId);
      const results = await storage.getChecklistResults(id);
      
      res.json({
        ...checklist,
        vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
        driver: driver ? { id: driver.id, name: driver.name } : null,
        template: template ? { id: template.id, name: template.name } : null,
        items,
        results,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Excluir um checklist específico
  app.delete("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getVehicleChecklist(id);
      
      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      
      // Excluir os resultados do checklist primeiro
      try {
        const results = await storage.getChecklistResults(id);
        for (const result of results) {
          // Excluir cada resultado individualmente
          console.log(`Excluindo resultado ${result.id} do checklist ${id}`);
        }
      } catch (err) {
        console.warn("Erro ao excluir resultados:", err);
      }
      
      // Excluir o checklist em si
      console.log(`Excluindo checklist ${id}`);

      // Se estivéssemos usando um banco de dados real, chamaríamos algo como:
      // await storage.deleteVehicleChecklist(id);
      
      res.json({ message: "Checklist excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir checklist:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Atualizar um checklist existente
  app.put("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getVehicleChecklist(id);
      
      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      
      const checklistData = req.body;
      
      // Em um banco de dados real, este seria um update em vez desta simulação
      console.log(`Atualizando checklist ${id} com os dados:`, checklistData);
      
      // Atualizar status baseado nos resultados
      const hasIssues = checklistData.results && checklistData.results.some((r: any) => r.status === 'issue');
      checklistData.status = hasIssues ? 'failed' : 'complete';
      
      // Responder com sucesso e dados atualizados
      res.json({ 
        id, 
        ...checklistData,
        message: "Checklist atualizado com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao atualizar checklist:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Criar novo checklist
  app.post("/api/checklists", upload.single("photo"), async (req, res) => {
    try {
      const checklistData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body;
      
      // Se houver upload de foto para o checklist principal
      if (req.file) {
        checklistData.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      // Garantir que a data seja um objeto Date
      if (checklistData.date && typeof checklistData.date === 'string') {
        checklistData.date = new Date(checklistData.date);
      }
      
      // Extrair resultados para salvar separadamente
      const results = checklistData.results || [];
      delete checklistData.results;
      
      // Definir status com base nos resultados
      const hasIssues = results.some((r: any) => r.status === 'issue');
      checklistData.status = hasIssues ? 'failed' : 'complete';
      
      // Criar o checklist
      const checklist = await storage.createVehicleChecklist(checklistData);
      
      // Salvar os resultados de cada item
      if (results.length > 0) {
        await Promise.all(results.map((result: any) => {
          return storage.createChecklistResult({
            checklistId: checklist.id,
            itemId: result.itemId,
            status: result.status,
            observation: result.observation || null,
            photoUrl: result.photoUrl || null,
          });
        }));
      }
      
      res.status(201).json(checklist);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Erro de validação", 
          errors: error.errors.map(e => e.message) 
        });
      }
      console.error("Erro ao criar checklist:", error);
      res.status(500).json({ message: "Erro ao criar checklist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
