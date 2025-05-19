import type { Express, Request, Response } from "express";
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
      const typeData = req.body;
      
      // Validar dados
      insertFuelTypeSchema.parse(typeData);
      
      const fuelType = await storage.createFuelType(typeData);
      res.status(201).json(fuelType);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Erro ao criar tipo de combustível:", error);
      res.status(500).json({ message: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
