import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db"; // Import db instance
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import multer from "multer";
import { z, ZodError } from "zod"; // Imported ZodError
import { 
  extendedRegistrationSchema, 
  fuelRegistrationSchema, 
  maintenanceRegistrationSchema, 
  tripRegistrationSchema,
  ZodInsertVehicleSchema,
  ZodInsertDriverSchema,
  insertFuelStationSchema,
  insertFuelTypeSchema,
  insertMaintenanceTypeSchema,
  InsertRole,
  // Checklist schemas for validation
  insertChecklistTemplateSchema,
  insertChecklistItemSchema,
  insertVehicleChecklistSchema,
  insertChecklistResultSchema,
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from 'bcryptjs';

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
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas") as any); // Cast error to any for multer cb
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());
  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const replitUserClaims = (req.user as any)?.claims;
      if (!replitUserClaims || !replitUserClaims.sub) {
        return res.status(404).json({ message: "Usuário Replit não encontrado na sessão." });
      }

      const userId = replitUserClaims.sub;
      const dbUser = await storage.getUser(userId);

      if (!dbUser) {
        return res.status(404).json({
          message: "Usuário não encontrado no banco de dados local.",
          id: userId,
          email: replitUserClaims.email,
          firstName: replitUserClaims.first_name,
          lastName: replitUserClaims.last_name,
          profileImageUrl: replitUserClaims.profile_image_url,
          role: null
        });
      }

      let userRole = null;
      if (dbUser.roleId) {
        const roleFromDb = await storage.getRole(dbUser.roleId);
        if (roleFromDb) {
          try {
            userRole = {
              name: roleFromDb.name,
              permissions: JSON.parse(roleFromDb.permissions as string || '{}')
            };
          } catch (e) {
            console.error("Error parsing role permissions for user:", userId, e);
            userRole = { name: roleFromDb.name, permissions: {} };
          }
        }
      }

      const authUserResponse = {
        id: dbUser.id,
        email: dbUser.email || replitUserClaims.email,
        firstName: dbUser.firstName || replitUserClaims.first_name,
        lastName: dbUser.lastName || replitUserClaims.last_name,
        profileImageUrl: dbUser.profileImageUrl || replitUserClaims.profile_image_url,
        role: userRole
      };
      res.json(authUserResponse);
    } catch (error: any) {
      console.error("Error fetching auth user details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do usuário.", details: error.message });
    }
  });

  const isAdmin = async (req: Request, res: Response, next: Function) => {
    // Development bypass
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    if (!req.user || !(req.user as any).claims) {
      return res.status(401).json({ message: "Não autenticado." });
    }
    const userId = (req.user as any).claims.sub;
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.roleId) {
        return res.status(403).json({ message: "Função de usuário não definida." });
      }
      const userRole = await storage.getRole(user.roleId);
      if (!userRole || userRole.name !== "admin") {
        return res.status(403).json({ message: "Acesso negado. Requer função de administrador." });
      }
      next();
    } catch (error: any) {
      console.error("Error in isAdmin middleware:", error);
      res.status(500).json({ message: "Erro ao verificar função do usuário.", details: error.message });
    }
  };

  const roleSchema = z.object({
    name: z.string().min(1, "Nome do perfil é obrigatório."),
    description: z.string().optional(),
    permissions: z.string().refine((val) => {
      try { JSON.parse(val); return true; } catch { return false; }
    }, { message: "Permissões devem ser um JSON válido." })
  });

  app.get("/api/roles", isAuthenticated, async (req, res) => {
    try {
      const allRoles = await storage.getRoles();
      res.json(allRoles.map(role => ({...role, permissions: JSON.parse(role.permissions as string)})));
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/roles:", error);
      res.status(500).json({ message: "Erro ao buscar perfis de acesso.", details: error.message });
    }
  });

  app.post("/api/roles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const roleData = roleSchema.parse(req.body);
      const newRole = await storage.createRole(roleData as InsertRole);
      res.status(201).json({...newRole, permissions: JSON.parse(newRole.permissions as string)});
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/roles:", error);
      res.status(500).json({ message: "Erro ao criar perfil de acesso.", details: error.message });
    }
  });

  app.put("/api/roles/:roleId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) return res.status(400).json({ message: "ID do perfil inválido."});
      const roleData = roleSchema.partial().parse(req.body);
      const updatedRole = await storage.updateRole(roleId, roleData as Partial<InsertRole>);
      if (!updatedRole) return res.status(404).json({ message: "Perfil de acesso não encontrado para atualização." });
      res.json({...updatedRole, permissions: JSON.parse(updatedRole.permissions as string)});
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/roles/${req.params.roleId}:`, error);
      res.status(500).json({ message: "Erro ao atualizar perfil de acesso.", details: error.message });
    }
  });

  app.delete("/api/roles/:roleId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) return res.status(400).json({ message: "ID do perfil inválido."});
      const deleted = await storage.deleteRole(roleId);
      if (!deleted) return res.status(404).json({ message: "Perfil de acesso não encontrado para exclusão." });
      res.json({ message: "Perfil de acesso excluído com sucesso." });
    } catch (error: any) {
      if (error.message && error.message.includes("Role is currently in use")) {
        // TODO: Use structured logger
        console.error(`Error deleting /api/roles/${req.params.roleId} (Role in use):`, error);
        return res.status(400).json({ message: error.message });
      }
      // TODO: Use structured logger
      console.error(`Error deleting /api/roles/${req.params.roleId}:`, error);
      res.status(500).json({ message: "Erro ao excluir perfil de acesso.", details: error.message });
    }
  });

  const createUserSchema = z.object({
    email: z.string().email("Email inválido."),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres."),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roleId: z.number().int().positive("ID do Perfil é obrigatório e deve ser um inteiro positivo."),
  });

  const updateUserSchema = z.object({
    email: z.string().email("Email inválido.").optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roleId: z.number().int().positive("ID do Perfil deve ser um inteiro positivo.").optional(),
  });

  const changePasswordSchema = z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres."),
  });

  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersResponse = allUsers.map(u => {
        const { passwordHash, ...userView } = u;
        return userView;
      });
      res.json(usersResponse);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/users:", error);
      res.status(500).json({ message: "Erro ao listar usuários.", details: error.message });
    }
  });

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "Email já cadastrado." }); // 409 Conflict
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUserId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newUserFromDb = await storage.upsertUser({
        id: newUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: userData.roleId,
        passwordHash: hashedPassword,
      });
      const { passwordHash, ...userResponse } = newUserFromDb;
      res.status(201).json(userResponse);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/users:", error);
      res.status(500).json({ message: "Erro ao criar usuário.", details: error.message });
    }
  });

  app.put("/api/users/:userId", isAuthenticated, async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = (req.user as any).claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      const currentUserRole = currentUser && currentUser.roleId ? await storage.getRole(currentUser.roleId) : null;
      const updateData = updateUserSchema.parse(req.body);

      if (targetUserId !== currentUserId && (!currentUserRole || currentUserRole.name !== 'admin')) {
        return res.status(403).json({ message: "Não autorizado a atualizar este usuário." });
      }
      if (updateData.roleId && (!currentUserRole || currentUserRole.name !== 'admin')) {
        return res.status(403).json({ message: "Não autorizado a alterar o perfil do usuário." });
      }

      const userToUpdate = await storage.getUser(targetUserId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "Usuário não encontrado para atualização." });
      }

      const updatedUser = await storage.upsertUser({
        id: targetUserId,
        email: updateData.email || userToUpdate.email,
        firstName: updateData.firstName || userToUpdate.firstName,
        lastName: updateData.lastName || userToUpdate.lastName,
        roleId: updateData.roleId || userToUpdate.roleId,
        profileImageUrl: userToUpdate.profileImageUrl,
      });
      const { passwordHash, ...userResponse } = updatedUser; // Exclude passwordHash from response
      res.json(userResponse);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/users/${req.params.userId}:`, error);
      res.status(500).json({ message: "Erro ao atualizar usuário.", details: error.message });
    }
  });

  app.delete("/api/users/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      if (targetUserId === (req.user as any).claims.sub) {
        return res.status(400).json({ message: "Não é possível excluir o próprio usuário por esta rota." });
      }
      const deleted = await storage.deleteUser(targetUserId);
      if (!deleted) return res.status(404).json({ message: "Usuário não encontrado para exclusão." });
      res.json({ message: "Usuário excluído com sucesso." });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error deleting /api/users/${req.params.userId}:`, error);
      res.status(500).json({ message: "Erro ao excluir usuário.", details: error.message });
    }
  });

  app.put("/api/users/:userId/password", isAuthenticated, async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = (req.user as any).claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      const currentUserRole = currentUser && currentUser.roleId ? await storage.getRole(currentUser.roleId) : null;
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userToUpdate = await storage.getUser(targetUserId);

      if (!userToUpdate) {
         return res.status(404).json({ message: "Usuário não encontrado." });
      }
      if (!userToUpdate.passwordHash && targetUserId === currentUserId) {
         return res.status(400).json({ message: "Este usuário não está configurado para login com senha local." });
      }
      if (targetUserId === currentUserId) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Senha atual é obrigatória." });
        }
        if (!userToUpdate.passwordHash) {
             return res.status(400).json({ message: "Usuário não possui senha configurada para verificação." });
        }
        const isMatch = await bcrypt.compare(currentPassword, userToUpdate.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: "Senha atual incorreta." });
        }
      } else if (!currentUserRole || currentUserRole.name !== 'admin') {
        return res.status(403).json({ message: "Não autorizado a alterar a senha deste usuário." });
      }
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(targetUserId, newHashedPassword);
      res.json({ message: "Senha alterada com sucesso." });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating password for /api/users/${req.params.userId}/password:`, error);
      res.status(500).json({ message: "Erro ao alterar senha.", details: error.message });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getVehicles();
      res.json(items);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/vehicles:", error);
      res.status(500).json({ message: "Erro ao buscar veículos.", details: error.message });
    }
  });

  app.get("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do veículo inválido."});
      const item = await storage.getVehicle(id);
      if (!item) return res.status(404).json({ message: "Veículo não encontrado." });
      res.json(item);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/vehicles/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar veículo.", details: error.message });
    }
  });

  app.post("/api/vehicles", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
      const vehicleData = req.body;
      if (vehicleData.year) vehicleData.year = parseInt(vehicleData.year);
      if (req.file) vehicleData.imageUrl = `/uploads/${req.file.filename}`;
      const parsedData = ZodInsertVehicleSchema.parse(vehicleData);
      const vehicle = await storage.createVehicle(parsedData);
      res.status(201).json(vehicle);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar veículo.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/vehicles:", error);
      res.status(500).json({ message: "Erro ao criar veículo.", details: error.message });
    }
  });

  app.put("/api/vehicles/:id", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => { // Added upload.single
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do veículo inválido."});
      const vehicleData = req.body;
      if (vehicleData.year) vehicleData.year = parseInt(vehicleData.year);
      if (req.file) vehicleData.imageUrl = `/uploads/${req.file.filename}`;

      // Use .partial() for update schemas if not all fields are required
      const parsedData = ZodInsertVehicleSchema.partial().parse(vehicleData);

      const vehicle = await storage.updateVehicle(id, parsedData);
      if (!vehicle) return res.status(404).json({ message: "Veículo não encontrado para atualização." });
      res.json(vehicle);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar veículo.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/vehicles/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao atualizar veículo.", details: error.message });
    }
  });

  app.delete("/api/vehicles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do veículo inválido."});
      const deleted = await storage.deleteVehicle(id);
      if (!deleted) return res.status(404).json({ message: "Veículo não encontrado para exclusão." });
      res.json({ message: "Veículo excluído com sucesso." });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error deleting /api/vehicles/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao excluir veículo.", details: error.message });
    }
  });

  // Driver routes
  app.get("/api/drivers", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getDrivers();
      res.json(items);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/drivers:", error);
      res.status(500).json({ message: "Erro ao buscar motoristas.", details: error.message });
    }
  });

  app.get("/api/drivers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do motorista inválido."});
      const item = await storage.getDriver(id);
      if (!item) return res.status(404).json({ message: "Motorista não encontrado." });
      res.json(item);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/drivers/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar motorista.", details: error.message });
    }
  });

  app.post("/api/drivers", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
      const driverData = req.body;
      if (req.file) driverData.imageUrl = `/uploads/${req.file.filename}`;
      const parsedData = ZodInsertDriverSchema.parse(driverData);
      const driver = await storage.createDriver(parsedData);
      res.status(201).json(driver);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar motorista.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/drivers:", error);
      res.status(500).json({ message: "Erro ao criar motorista.", details: error.message });
    }
  });

  app.put("/api/drivers/:id", isAuthenticated, isAdmin, upload.single('image'), async (req, res) => { // Added upload.single
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do motorista inválido."});
      const driverData = req.body;
      if (req.file) driverData.imageUrl = `/uploads/${req.file.filename}`;
      const parsedData = ZodInsertDriverSchema.partial().parse(driverData);
      const driver = await storage.updateDriver(id, parsedData);
      if (!driver) return res.status(404).json({ message: "Motorista não encontrado para atualização." });
      res.json(driver);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar motorista.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/drivers/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao atualizar motorista.", details: error.message });
    }
  });

  app.delete("/api/drivers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do motorista inválido."});
      const deleted = await storage.deleteDriver(id);
      if (!deleted) return res.status(404).json({ message: "Motorista não encontrado para exclusão." });
      res.json({ message: "Motorista excluído com sucesso." });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error deleting /api/drivers/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao excluir motorista.", details: error.message });
    }
  });

  // Fuel Station routes
  app.get("/api/fuel-stations", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getFuelStations();
      res.json(items);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/fuel-stations:", error);
      res.status(500).json({ message: "Erro ao buscar postos de combustível.", details: error.message });
    }
  });

  app.get("/api/fuel-stations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do posto inválido."});
      const item = await storage.getFuelStation(id);
      if (!item) return res.status(404).json({ message: "Posto de combustível não encontrado." });
      res.json(item);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/fuel-stations/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar posto de combustível.", details: error.message });
    }
  });

  app.post("/api/fuel-stations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsedData = insertFuelStationSchema.parse(req.body);
      const station = await storage.createFuelStation(parsedData);
      res.status(201).json(station);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar posto.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/fuel-stations:", error);
      res.status(500).json({ message: "Erro ao criar posto de combustível.", details: error.message });
    }
  });

  app.put("/api/fuel-stations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do posto inválido."});
      const parsedData = insertFuelStationSchema.partial().parse(req.body);
      const station = await storage.updateFuelStation(id, parsedData);
      if (!station) return res.status(404).json({ message: "Posto de combustível não encontrado para atualização." });
      res.json(station);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar posto.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/fuel-stations/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao atualizar posto de combustível.", details: error.message });
    }
  });

  app.delete("/api/fuel-stations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do posto inválido."});
      const deleted = await storage.deleteFuelStation(id);
      if (!deleted) return res.status(404).json({ message: "Posto de combustível não encontrado para exclusão." });
      res.json({ message: "Posto de combustível excluído com sucesso." });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error deleting /api/fuel-stations/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao excluir posto de combustível.", details: error.message });
    }
  });

  // Fuel Type routes
  app.get("/api/fuel-types", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getFuelTypes();
      res.json(items);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/fuel-types:", error);
      res.status(500).json({ message: "Erro ao buscar tipos de combustível.", details: error.message });
    }
  });

  app.get("/api/fuel-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do tipo de combustível inválido."});
      const item = await storage.getFuelType(id);
      if (!item) return res.status(404).json({ message: "Tipo de combustível não encontrado." });
      res.json(item);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/fuel-types/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar tipo de combustível.", details: error.message });
    }
  });

  app.post("/api/fuel-types", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsedData = insertFuelTypeSchema.parse(req.body);
      const fuelType = await storage.createFuelType(parsedData);
      res.status(201).json(fuelType);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar tipo de combustível.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/fuel-types:", error);
      res.status(500).json({ message: "Erro ao criar tipo de combustível.", details: error.message });
    }
  });

  app.put("/api/fuel-types/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do tipo de combustível inválido."});
      const parsedData = insertFuelTypeSchema.partial().parse(req.body);
      const type = await storage.updateFuelType(id, parsedData);
      if (!type) return res.status(404).json({ message: "Tipo de combustível não encontrado para atualização." });
      res.json(type);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar tipo de combustível.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/fuel-types/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao atualizar tipo de combustível.", details: error.message });
    }
  });

  app.delete("/api/fuel-types/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do tipo de combustível inválido."});
      const deleted = await storage.deleteFuelType(id);
      if (!deleted) return res.status(404).json({ message: "Tipo de combustível não encontrado para exclusão." });
      res.json({ message: "Tipo de combustível excluído com sucesso." });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error deleting /api/fuel-types/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao excluir tipo de combustível.", details: error.message });
    }
  });

  // Maintenance Type routes
  app.get("/api/maintenance-types", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getMaintenanceTypes();
      res.json(items);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/maintenance-types:", error);
      res.status(500).json({ message: "Erro ao buscar tipos de manutenção.", details: error.message });
    }
  });

  app.get("/api/maintenance-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do tipo de manutenção inválido."});
      const item = await storage.getMaintenanceType(id);
      if (!item) return res.status(404).json({ message: "Tipo de manutenção não encontrado." });
      res.json(item);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/maintenance-types/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar tipo de manutenção.", details: error.message });
    }
  });

  app.post("/api/maintenance-types", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsedData = insertMaintenanceTypeSchema.parse(req.body);
      const maintenanceType = await storage.createMaintenanceType(parsedData);
      res.status(201).json(maintenanceType);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar tipo de manutenção.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/maintenance-types:", error);
      res.status(500).json({ message: "Erro ao criar tipo de manutenção.", details: error.message });
    }
  });

  app.put("/api/maintenance-types/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do tipo de manutenção inválido."});
      const parsedData = insertMaintenanceTypeSchema.partial().parse(req.body);
      const type = await storage.updateMaintenanceType(id, parsedData);
      if (!type) return res.status(404).json({ message: "Tipo de manutenção não encontrado para atualização." });
      res.json(type);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar tipo de manutenção.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/maintenance-types/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao atualizar tipo de manutenção.", details: error.message });
    }
  });

  app.delete("/api/maintenance-types/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do tipo de manutenção inválido."});
      const deleted = await storage.deleteMaintenanceType(id);
      if (!deleted) return res.status(404).json({ message: "Tipo de manutenção não encontrado para exclusão." });
      res.json({ message: "Tipo de manutenção excluído com sucesso." });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error deleting /api/maintenance-types/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao excluir tipo de manutenção.", details: error.message });
    }
  });

  // Registration routes
  app.get("/api/registrations", isAuthenticated, async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const registrations = await storage.getRegistrations({ type, vehicleId, startDate, endDate });
      const registrationsWithDetails = await Promise.all(
        registrations.map(async (reg) => {
          const vehicle = await storage.getVehicle(reg.vehicleId);
          const driver = await storage.getDriver(reg.driverId);
          let fuelStation, fuelType, maintenanceType;
          if (reg.fuelStationId) fuelStation = await storage.getFuelStation(reg.fuelStationId);
          if (reg.fuelTypeId) fuelType = await storage.getFuelType(reg.fuelTypeId);
          if (reg.maintenanceTypeId) maintenanceType = await storage.getMaintenanceType(reg.maintenanceTypeId);
          return { ...reg, vehicle, driver, fuelStation, fuelType, maintenanceType };
        })
      );
      res.json(registrationsWithDetails);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/registrations:", error);
      res.status(500).json({ message: "Erro ao buscar registros.", details: error.message });
    }
  });

  app.get("/api/registrations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do registro inválido."});
      const registration = await storage.getRegistration(id);
      if (!registration) return res.status(404).json({ message: "Registro não encontrado." });

      const vehicle = await storage.getVehicle(registration.vehicleId);
      const driver = await storage.getDriver(registration.driverId);
      let fuelStation, fuelType, maintenanceType;
      if (registration.fuelStationId) fuelStation = await storage.getFuelStation(registration.fuelStationId);
      if (registration.fuelTypeId) fuelType = await storage.getFuelType(registration.fuelTypeId);
      if (registration.maintenanceTypeId) maintenanceType = await storage.getMaintenanceType(registration.maintenanceTypeId);

      res.json({ ...registration, vehicle, driver, fuelStation, fuelType, maintenanceType });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/registrations/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar registro.", details: error.message });
    }
  });

  app.post("/api/registrations", isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const registrationData = JSON.parse(req.body.data);
      if (registrationData.date) registrationData.date = new Date(registrationData.date);
      if (req.file) registrationData.photoUrl = `/uploads/${req.file.filename}`;

      let schema;
      switch (registrationData.type) {
        case "fuel": schema = fuelRegistrationSchema; break;
        case "maintenance": schema = maintenanceRegistrationSchema; break;
        case "trip": schema = tripRegistrationSchema; break;
        default: schema = extendedRegistrationSchema;
      }
      const parsedData = schema.parse(registrationData);
      const registration = await storage.createRegistration(parsedData);
      res.status(201).json(registration);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar registro.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/registrations:", error);
      res.status(500).json({ message: "Erro ao criar registro.", details: error.message });
    }
  });

  app.put("/api/registrations/:id", isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do registro inválido."});
      let registrationData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
      if (req.file) registrationData.photoUrl = `/uploads/${req.file.filename}`;
      if (registrationData.date && typeof registrationData.date === 'string') {
        registrationData.date = new Date(registrationData.date);
      }
      // Here, you might want to use a partial schema for updates if not all fields are required
      // For simplicity, using extendedRegistrationSchema, but ensure client sends all expected fields or handle partial updates
      const parsedData = extendedRegistrationSchema.partial().parse(registrationData);
      const updatedRegistration = await storage.updateRegistration(id, parsedData);
      if (!updatedRegistration) return res.status(404).json({ message: "Registro não encontrado para atualização." });
      res.json({ message: "Registro atualizado com sucesso.", registration: updatedRegistration });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar registro.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error(`Error updating /api/registrations/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao atualizar registro.", details: error.message });
    }
  });

  app.delete("/api/registrations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do registro inválido."});
      const deleted = await storage.deleteRegistration(id);
      if (!deleted) return res.status(404).json({ message: "Registro não encontrado para exclusão." });
      res.json({ message: "Registro excluído com sucesso.", success: true, id: id });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error deleting /api/registrations/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao excluir registro.", details: error.message });
    }
  });

  // Checklist Template Routes
  app.get("/api/checklist-templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getChecklistTemplates();
      res.json(templates);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Error fetching /api/checklist-templates:", error);
      res.status(500).json({ message: "Erro ao buscar templates de checklist.", details: error.message });
    }
  });

  app.get("/api/checklist-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do template inválido."});
      const template = await storage.getChecklistTemplate(id);
      if (!template) return res.status(404).json({ message: "Template de checklist não encontrado." });
      const items = await storage.getChecklistItems(id);
      res.json({ ...template, items });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/checklist-templates/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar template de checklist.", details: error.message });
    }
  });

  app.post("/api/checklist-templates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsedData = insertChecklistTemplateSchema.parse(req.body);
      const template = await storage.createChecklistTemplate(parsedData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar template.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/checklist-templates:", error);
      res.status(500).json({ message: "Erro ao criar template de checklist.", details: error.message });
    }
  });

  app.put("/api/checklist-templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do template inválido." });
      
      const parsedData = insertChecklistTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updateChecklistTemplate(id, parsedData);
      
      if (!updatedTemplate) return res.status(404).json({ message: "Template de checklist não encontrado." });
      res.json({ message: "Template atualizado com sucesso.", template: updatedTemplate });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar template.", errors: error.errors });
      }
      console.error(`Error updating /api/checklist-templates/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao atualizar template de checklist.", details: error.message });
    }
  });

  app.delete("/api/checklist-templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do template inválido." });
      
      const deleted = await storage.deleteChecklistTemplate(id);
      if (!deleted) return res.status(404).json({ message: "Template de checklist não encontrado." });
      
      res.json({ message: "Template excluído com sucesso.", success: true, id: id });
    } catch (error: any) {
      console.error(`Error deleting /api/checklist-templates/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao excluir template de checklist.", details: error.message });
    }
  });

  // Checklist Item Routes (assuming items are managed in context of a template, or globally if needed)
   app.get("/api/checklist-templates/:templateId/items", isAuthenticated, async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      if (isNaN(templateId)) return res.status(400).json({ message: "ID do template inválido."});
      // Optional: Check if template exists before fetching items
      const template = await storage.getChecklistTemplate(templateId);
      if (!template) return res.status(404).json({ message: "Template de checklist não encontrado." });

      const items = await storage.getChecklistItems(templateId);
      res.json(items);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/checklist-templates/${req.params.templateId}/items:`, error);
      res.status(500).json({ message: "Erro ao buscar itens de checklist.", details: error.message });
    }
  });

  app.post("/api/checklist-items", isAuthenticated, isAdmin, async (req, res) => { // Typically, this would be /api/checklist-templates/:templateId/items
    try {
      const parsedData = insertChecklistItemSchema.parse(req.body);
      // Optional: Check if templateId in parsedData.templateId exists
      const template = await storage.getChecklistTemplate(parsedData.templateId);
      if (!template) return res.status(400).json({ message: `Template com ID ${parsedData.templateId} não encontrado.` });

      const item = await storage.createChecklistItem(parsedData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar item de checklist.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Error creating /api/checklist-items:", error);
      res.status(500).json({ message: "Erro ao criar item de checklist.", details: error.message });
    }
  });

  // Vehicle Checklist (Checklist Instance) Routes
  app.get("/api/checklists", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
      const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const checklists = await storage.getVehicleChecklists({ vehicleId, driverId, startDate, endDate });
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
      // TODO: Use structured logger
      console.error("Error fetching /api/checklists:", error);
      res.status(500).json({ message: "Erro ao buscar checklists de veículos.", details: error.message });
    }
  });

  app.get("/api/checklists/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do checklist inválido."});
      const checklist = await storage.getVehicleChecklist(id);
      if (!checklist) return res.status(404).json({ message: "Checklist de veículo não encontrado." });

      const vehicle = await storage.getVehicle(checklist.vehicleId);
      const driver = await storage.getDriver(checklist.driverId);
      const template = await storage.getChecklistTemplate(checklist.templateId);
      const items = await storage.getChecklistItems(checklist.templateId); // Items of the template
      const results = await storage.getChecklistResults(id); // Results specific to this checklist instance

      res.json({
        ...checklist,
        vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
        driver: driver ? { id: driver.id, name: driver.name } : null,
        template: template ? { id: template.id, name: template.name } : null,
        items,
        results,
      });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/checklists/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar checklist de veículo.", details: error.message });
    }
  });

  // This is effectively the same as /api/checklists/:id, keeping for compatibility if frontend uses it.
  app.get("/api/checklists/edit/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do checklist inválido."});
      const checklist = await storage.getVehicleChecklist(id);
      if (!checklist) return res.status(404).json({ message: "Checklist não encontrado para edição." });

      const vehicle = await storage.getVehicle(checklist.vehicleId);
      const driver = await storage.getDriver(checklist.driverId);
      const template = await storage.getChecklistTemplate(checklist.templateId);
      const items = await storage.getChecklistItems(checklist.templateId);
      const results = await storage.getChecklistResults(id);
      const processedResults = results.map(result => {
        if (result.photoUrl && !result.photoUrl.startsWith('data:') && !result.photoUrl.startsWith('/') && !result.photoUrl.startsWith('http')) {
          result.photoUrl = '/' + result.photoUrl;
        }
        return result;
      });
      res.json({
        ...checklist,
        vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
        driver: driver ? { id: driver.id, name: driver.name } : null,
        template: template ? { id: template.id, name: template.name } : null,
        items,
        results: processedResults,
      });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/checklists/edit/${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao obter dados para edição de checklist.", details: error.message });
    }
  });

  app.post("/api/checklists", isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const rawData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
      if (req.file) rawData.photoUrl = `/uploads/${req.file.filename}`;
      if (rawData.date && typeof rawData.date === 'string') rawData.date = new Date(rawData.date);

      const resultsData = rawData.results || [];
      delete rawData.results;

      const hasIssues = resultsData.some((r: any) => r.status === 'issue');
      rawData.status = hasIssues ? 'failed' : 'complete';

      const parsedChecklistData = insertVehicleChecklistSchema.parse(rawData);

      let checklist;
      await db.transaction(async (tx) => {
        checklist = await storage.createVehicleChecklist(parsedChecklistData, tx);

        if (resultsData.length > 0) {
          await Promise.all(resultsData.map((result: any) => {
            const parsedResultData = insertChecklistResultSchema.parse({
              ...result,
              checklistId: checklist.id, // Ensure checklistId is set
            });
            return storage.createChecklistResult(parsedResultData, tx);
          }));
        }
      });
      res.status(201).json({ message: "Checklist criado com sucesso.", checklist });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar checklist.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Erro ao criar checklist:", error);
      res.status(500).json({ message: "Erro ao criar checklist.", details: error.message });
    }
  });

  app.put("/api/checklists/:id", isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do checklist inválido."});

      const existingChecklist = await storage.getVehicleChecklist(id);
      if (!existingChecklist) return res.status(404).json({ message: "Checklist não encontrado para atualização." });

      const rawData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
      if (req.file) rawData.photoUrl = `/uploads/${req.file.filename}`;

      const resultsData = rawData.results || [];
      delete rawData.results;

      const hasIssues = resultsData.some((r: any) => r.status === 'issue');
      rawData.status = hasIssues ? 'failed' : 'complete';

      // Ensure all fields expected by insertVehicleChecklistSchema (used by Partial) are present or undefined
      const checklistUpdatePayload = {
        vehicleId: rawData.vehicleId,
        driverId: rawData.driverId,
        templateId: rawData.templateId,
        odometer: rawData.odometer,
        observations: rawData.observations || null,
        status: rawData.status,
        photoUrl: rawData.photoUrl || null,
        // date is not typically updated, but if it is:
        // date: rawData.date ? (typeof rawData.date === 'string' ? new Date(rawData.date) : rawData.date) : undefined,
      };

      const parsedChecklistData = insertVehicleChecklistSchema.partial().parse(checklistUpdatePayload);

      let updatedChecklist;
      await db.transaction(async (tx) => {
        updatedChecklist = await storage.updateVehicleChecklist(id, parsedChecklistData, tx);
        await storage.deleteChecklistResults(id, tx); // Clear old results

        if (resultsData.length > 0) {
          await Promise.all(resultsData.map((result: any) => {
             const parsedResultData = insertChecklistResultSchema.parse({
              ...result,
              checklistId: id, // Ensure checklistId is set
            });
            return storage.createChecklistResult(parsedResultData, tx);
          }));
        }
      });
      res.json({ message: "Checklist atualizado com sucesso.", checklist: updatedChecklist });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar checklist.", errors: error.errors });
      }
      // TODO: Use structured logger
      console.error("Erro ao atualizar checklist:", error);
      res.status(500).json({ message: "Erro ao atualizar checklist.", details: error.message });
    }
  });

  app.delete("/api/checklists/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do checklist inválido."});
      const checklist = await storage.getVehicleChecklist(id);
      if (!checklist) return res.status(404).json({ message: "Checklist não encontrado para exclusão." });
      
      await storage.deleteChecklistResults(id); // Delete associated results first
      const deleted = await storage.deleteVehicleChecklist(id);
      // The line above already returns boolean, this re-check is redundant if storage.deleteVehicleChecklist is reliable
      if (!deleted) return res.status(404).json({ message: "Falha ao excluir checklist, pode já ter sido removido." });

      res.json({ message: "Checklist excluído com sucesso." });
    } catch (error: any) {
      // TODO: Use structured logger
      console.error("Erro ao excluir checklist:", error);
      res.status(500).json({ message: "Erro ao excluir checklist.", details: error.message });
    }
  });

  // Checklist Result Routes (usually managed via /api/checklists/:id results array, but direct routes can be useful)
  app.get("/api/checklists/:checklistId/results", isAuthenticated, async (req, res) => {
    try {
      const checklistId = parseInt(req.params.checklistId);
      if (isNaN(checklistId)) return res.status(400).json({ message: "ID do checklist inválido."});

      // Optional: Check if parent checklist exists
      const parentChecklist = await storage.getVehicleChecklist(checklistId);
      if (!parentChecklist) return res.status(404).json({ message: "Checklist pai não encontrado." });

      const results = await storage.getChecklistResults(checklistId);
      const processedResults = results.map(result => {
        if (result.photoUrl && !result.photoUrl.startsWith('data:') && !result.photoUrl.startsWith('/') && !result.photoUrl.startsWith('http')) {
          result.photoUrl = '/' + result.photoUrl;
        }
        return result;
      });
      res.json(processedResults);
    } catch (error: any) {
      // TODO: Use structured logger
      console.error(`Error fetching /api/checklists/${req.params.checklistId}/results:`, error);
      res.status(500).json({ message: "Erro ao buscar resultados do checklist.", details: error.message });
    }
  });

  // Individual checklist result routes
  app.post("/api/checklist-results", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertChecklistResultSchema.parse(req.body);
      const result = await storage.createChecklistResult(parsedData);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao criar resultado.", errors: error.errors });
      }
      console.error("Error creating checklist result:", error);
      res.status(500).json({ message: "Erro ao criar resultado do checklist.", details: error.message });
    }
  });

  app.put("/api/checklist-results/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do resultado inválido." });
      
      const parsedData = insertChecklistResultSchema.partial().parse(req.body);
      const updatedResult = await storage.updateChecklistResult(id, parsedData);
      
      if (!updatedResult) return res.status(404).json({ message: "Resultado não encontrado." });
      res.json({ message: "Resultado atualizado com sucesso.", result: updatedResult });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Erro de validação ao atualizar resultado.", errors: error.errors });
      }
      console.error("Error updating checklist result:", error);
      res.status(500).json({ message: "Erro ao atualizar resultado.", details: error.message });
    }
  });

  app.delete("/api/checklist-results/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID do resultado inválido." });
      
      const deleted = await storage.deleteChecklistResult(id);
      if (!deleted) return res.status(404).json({ message: "Resultado não encontrado." });
      
      res.json({ message: "Resultado excluído com sucesso.", success: true, id: id });
    } catch (error: any) {
      console.error("Error deleting checklist result:", error);
      res.status(500).json({ message: "Erro ao excluir resultado.", details: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}