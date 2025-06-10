import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  UserPlus, 
  Trash2, 
  Edit, 
  Shield, 
  KeyRound, 
  User,
  ScrollText,
  CheckSquare,
  GanttChart,
  FileText,
  Settings,
  Users,
  Car,
  PlusCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient"; // Assuming an apiClient utility
import { usePermissions } from "@/lib/usePermissions"; // Import usePermissions

// Tipos (Backend aligned)
interface ApiUser { // Renamed to avoid conflict with useAuth's User
  id: string; // varchar from Replit Auth
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  // passwordHash is not sent to frontend
  // Optional: include role object if backend joins them
  role?: ApiRole;
}

interface UserFormData {
  email: string;
  password?: string; // Only for creation
  firstName?: string;
  lastName?: string;
  roleId: number;
}

interface PasswordChangeData {
  currentPassword?: string; // Optional for admin
  newPassword?: string;
}


// Interface para perfis de usuário (Backend aligned)
interface ApiRole { // Renamed to avoid conflict
  id: number; // serial
  name: string;
  description?: string;
  permissions: Record<string, boolean>; // Parsed from JSON string
}

interface RoleFormData {
  name: string;
  description?: string;
  permissions: string; // JSON string
}


export default function UserManagement() {
  // const [users, setUsers] = useState<ApiUser[]>([]); // Will be replaced by react-query
  // const [userRoles, setUserRoles] = useState<ApiRole[]>([]); // Will be replaced by react-query
  // const [isLoading, setIsLoading] = useState(true); // Will be replaced by react-query status

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: authUser } = useAuth(); // Renamed to avoid conflict
  const [, setLocation] = useLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("users");

  // State for forms - to be aligned with ApiUser and ApiRole
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [currentRole, setCurrentRole] = useState<ApiRole | null>(null);

  // User form state
  const [userForm, setUserForm] = useState<Partial<UserFormData>>({});

  // Password change form state
  const [passwordChangeForm, setPasswordChangeForm] = useState<PasswordChangeData>({});

  // Role form state
  const [roleForm, setRoleForm] = useState<Partial<RoleFormData>>({
    permissions: JSON.stringify({ // Default permissions for new role form
      dashboard: false,
      registrations: false,
      history: false,
      reports: false,
      checklists: false,
      settings: false,
      userManagement: false,
      vehicleManagement: false,
      driverManagement: false
    })
  });
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // --- React Query Hooks ---
  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery<ApiUser[], Error>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiClient.get("/users");
      return res.data;
    },
  });

  const { data: roles = [], isLoading: isLoadingRoles, error: rolesError } = useQuery<ApiRole[], Error>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await apiClient.get("/roles");
      return res.data; // Assuming permissions are already parsed by an interceptor or backend sends object
    },
  });
  
  // --- User Mutations ---
  const createUserMutation = useMutation<ApiUser, Error, UserFormData>({
    mutationFn: async (userData) => {
      const res = await apiClient.post("/users", userData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Sucesso", description: "Usuário criado com sucesso." });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message || "Falha ao criar usuário.", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation<ApiUser, Error, Partial<UserFormData> & { id: string }>({
    mutationFn: async (userData) => {
      const { id, ...data } = userData;
      const res = await apiClient.put(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso." });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar usuário.", variant: "destructive" });
    },
  });
  
  const deleteUserMutation = useMutation<unknown, Error, string>({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message || "Falha ao excluir usuário.", variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation<unknown, Error, PasswordChangeData & { userId: string }>({
    mutationFn: async (data) => {
      const { userId, ...passwordData } = data;
      await apiClient.put(`/users/${userId}/password`, passwordData);
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Senha alterada com sucesso." });
      setPasswordDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message || "Falha ao alterar senha.", variant: "destructive" });
    },
  });

  // --- Role Mutations ---
  const createRoleMutation = useMutation<ApiRole, Error, RoleFormData>({
    mutationFn: async (roleData) => {
      const res = await apiClient.post("/roles", roleData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Sucesso", description: "Perfil criado com sucesso." });
      setRoleDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message || "Falha ao criar perfil.", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation<ApiRole, Error, Partial<RoleFormData> & { id: number }>({
    mutationFn: async (roleData) => {
      const { id, ...data } = roleData;
      const res = await apiClient.put(`/roles/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso." });
      setEditRoleDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar perfil.", variant: "destructive" });
    },
  });

  const deleteRoleMutation = useMutation<unknown, Error, number>({
    mutationFn: async (roleId: number) => {
      await apiClient.delete(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Sucesso", description: "Perfil excluído com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message || "Falha ao excluir perfil.", variant: "destructive" });
    },
  });


  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();
  
  // Admin check effect (placeholder, backend is the source of truth for protection)
  useEffect(() => {
    // console.log("Auth user for admin check:", authUser);
    // This is not a real security check for the frontend, more for UI hints if needed.
    // Actual security is enforced by `isAdmin` middleware on backend routes.
    // If authUser is null or doesn't have an admin role/permission, certain UI elements could be disabled/hidden.
    // For this subtask, we're focusing on API integration, so we'll skip comprehensive UI changes based on role for now.
  }, [authUser]);

  if (isLoadingPermissions || isLoadingUsers || isLoadingRoles) { // Combined loading state
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-blue-700 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Basic frontend access control
  // Check for a general admin permission or a specific user management permission.
  // Adjust "userManagement" to the actual permission key if different.
  if (!hasPermission("userManagement")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Você não tem permissão para gerenciar usuários e perfis.</p>
        </CardContent>
      </Card>
    );
  }

  // --- Form Validation ---
  const validateUserForm = () => {
    const errors: { [key: string]: string } = {};
    if (!userForm.email?.trim()) errors.email = "Email é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(userForm.email)) errors.email = "Email inválido";

    if (!currentUser) { // Only validate password for new users
      if (!userForm.password) errors.password = "Senha é obrigatória";
      else if (userForm.password.length < 6) errors.password = "A senha deve ter pelo menos 6 caracteres";
      // TODO: Add confirm password validation in UI and logic
    }
    if (userForm.roleId === undefined || userForm.roleId <= 0) errors.roleId = "Perfil é obrigatório";
    if (!userForm.firstName?.trim()) errors.firstName = "Primeiro nome é obrigatório.";
    if (!userForm.lastName?.trim()) errors.lastName = "Último nome é obrigatório.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => { // Keep for later refactor
    const errors: { [key: string]: string } = {};
    if (isSelfUser(currentUser?.id) && !passwordChangeForm.currentPassword) {
      errors.currentPassword = "Senha atual é obrigatória";
    }
    if (!passwordChangeForm.newPassword) errors.newPassword = "Nova senha é obrigatória";
    else if (passwordChangeForm.newPassword.length < 6) errors.newPassword = "A nova senha deve ter pelo menos 6 caracteres";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateRoleForm = () => {
    const errors: {[key: string]: string} = {};
    if (!roleForm.name?.trim()) errors.name = "Nome do perfil é obrigatório";
    if (!roleForm.permissions || !JSON.parse(roleForm.permissions)) errors.permissions = "Permissões são obrigatórias e devem ser JSON válido.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Dialog Openers ---
  const handleAddUser = () => {
    setCurrentUser(null);
    setUserForm({ email: "", password: "", firstName: "", lastName: "", roleId: roles.find(r => r.name.toLowerCase() === 'user')?.id || 0 });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  const handleEditUser = (user: ApiUser) => {
    setCurrentUser(user);
    setUserForm({ email: user.email, firstName: user.firstName, lastName: user.lastName, roleId: user.roleId });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  const handleChangePassword = (user: ApiUser) => {
    setCurrentUser(user);
    setPasswordChangeForm({ currentPassword: "", newPassword: "" });
    setFormErrors({});
    setPasswordDialogOpen(true);
  };
  
  const handleAddRole = () => {
    setCurrentRole(null);
    setRoleForm({ name: "", description: "", permissions: JSON.stringify({
        dashboard: false, registrations: false, history: false, reports: false, checklists: false,
        settings: false, userManagement: false, vehicleManagement: false, driverManagement: false
    })});
    setFormErrors({});
    setRoleDialogOpen(true);
  };
  
  const handleEditRole = (role: ApiRole) => {
    setCurrentRole(role);
    setRoleForm({ name: role.name, description: role.description, permissions: JSON.stringify(role.permissions) });
    setFormErrors({});
    setEditRoleDialogOpen(true);
  };

  // --- Save/Delete Handlers ---
  const handleSaveUser = () => {
    if (!validateUserForm()) return;
    if (currentUser) { // Edit
      updateUserMutation.mutate({ ...userForm, id: currentUser.id } as Partial<UserFormData> & { id: string });
    } else { // Create
      createUserMutation.mutate(userForm as UserFormData);
    }
  };
  
  const handleSavePassword = () => {
    if (!validatePasswordForm() || !currentUser) return;
    changePasswordMutation.mutate({ ...passwordChangeForm, userId: currentUser.id });
  };
  
  const handleSaveRole = () => {
    if (!validateRoleForm()) return;
    createRoleMutation.mutate(roleForm as RoleFormData);
  };
  
  const handleUpdateRole = () => {
    if (!validateRoleForm() || !currentRole) return;
    updateRoleMutation.mutate({ ...roleForm, id: currentRole.id } as Partial<RoleFormData> & { id: number });
  };
  
  const handleDeleteUser = (userId: string) => {
    if (userId === authUser?.id) { // Prevent self-deletion
      toast({ title: "Operação não permitida", description: "Você não pode excluir seu próprio usuário.", variant: "destructive" });
      return;
    }
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  const handleDeleteRole = (roleId: number) => {
    // Basic check if role is in use (can be more robust on backend)
    const isRoleInUse = users.some(user => user.roleId === roleId);
    if (isRoleInUse) {
      toast({ title: "Operação não permitida", description: "Este perfil está em uso por um ou mais usuários.", variant: "destructive" });
      return;
    }
    if (window.confirm("Tem certeza que deseja excluir este perfil?")) {
      deleteRoleMutation.mutate(roleId);
    }
  };
  
  // --- UI Helpers ---
  const getRoleName = (roleId?: number) => {
    if (!roleId) return "N/A";
    return roles.find(r => r.id === roleId)?.name || "Desconhecido";
  };
  
  const isSelfUser = (userId?: string) => {
    return authUser?.id === userId;
  };

  // --- Render Permission List ---
  const renderPermissionList = (permissions: {[key: string]: boolean}) => {
    const permissionLabels: {[key: string]: string} = {
      dashboard: "Dashboard",
      registrations: "Registros",
      history: "Histórico",
      reports: "Relatórios",
      checklists: "Checklists",
      settings: "Configurações",
      userManagement: "Gerenciar Usuários",
      vehicleManagement: "Gerenciar Veículos",
      driverManagement: "Gerenciar Motoristas"
    };
    
    return Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key]) => permissionLabels[key])
      .join(", ");
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <CardTitle className="text-2xl font-bold text-blue-900">
              Gerenciamento de Usuários
            </CardTitle>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                onClick={handleAddUser}
                className="bg-blue-700 hover:bg-blue-800 flex-1 sm:flex-none h-12 sm:h-10"
              >
                <UserPlus className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Novo Usuário</span>
              </Button>
              <Button 
                onClick={handleAddRole}
                className="bg-blue-700 hover:bg-blue-800 flex-1 sm:flex-none h-12 sm:h-10"
              >
                <Shield className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Novo Perfil</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-14 p-1">
          <TabsTrigger 
            value="users" 
            className="flex items-center justify-center gap-2 h-12 text-base"
          >
            <Users className="h-5 w-5" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="flex items-center justify-center gap-2 h-12 text-base"
          >
            <Shield className="h-5 w-5" />
            <span>Perfis de Acesso</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="pt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lista de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-700 border-t-transparent rounded-full"></div>
                </div>
              ) : usersError ? (
                <p className="text-red-500 py-4">Erro ao carregar usuários: {usersError.message}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-medium">Email</TableHead>
                        <TableHead className="font-medium">Nome Completo</TableHead>
                        <TableHead className="font-medium">Perfil</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || "N/A"}</TableCell>
                          <TableCell>{getRoleName(u.roleId)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleChangePassword(u)}
                                disabled={!u.id}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditUser(u)}
                                disabled={!u.id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={isSelfUser(u.id) || u.email === "admin@example.com" /* Placeholder for main admin protection */}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="pt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Perfis de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
             {isLoadingRoles ? (
                 <div className="flex justify-center p-8">
                   <div className="animate-spin h-8 w-8 border-4 border-blue-700 border-t-transparent rounded-full"></div>
                 </div>
              ) : rolesError ? (
                 <p className="text-red-500 py-4">Erro ao carregar perfis: {rolesError.message}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-medium">Nome</TableHead>
                        <TableHead className="font-medium">Descrição</TableHead>
                        <TableHead className="font-medium">Permissões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{r.description || "N/A"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">
                            {renderPermissionList(r.permissions)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditRole(r)}
                                disabled={r.name.toLowerCase() === "admin"} // Protect admin role by name
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => handleDeleteRole(r.id)}
                                disabled={r.name.toLowerCase() === "admin"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Diálogo para adicionar/editar usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {currentUser
                ? "Atualize as informações do usuário."
                : "Preencha as informações para criar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userForm.email || ""}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="Ex: usuario@example.com"
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>
            
            {currentUser === null && ( // Only show password fields for new user
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userForm.password || ""}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Digite a senha"
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                  )}
                </div>
                {/* TODO: Add Confirm Password Field for new user */}
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input
                id="firstName"
                value={userForm.firstName || ""}
                onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                placeholder="Ex: João"
              />
               {formErrors.firstName && (
                <p className="text-sm text-red-500 mt-1">{formErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Último Nome</Label>
              <Input
                id="lastName"
                value={userForm.lastName || ""}
                onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                placeholder="Ex: Silva"
              />
              {formErrors.lastName && (
                <p className="text-sm text-red-500 mt-1">{formErrors.lastName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roleId">Perfil</Label>
              <Select
                value={userForm.roleId?.toString() || ""}
                onValueChange={(value) => setUserForm({...userForm, roleId: parseInt(value)})}
              >
                <SelectTrigger id="roleId">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => ( // Use roles from useQuery
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUser}
              className="bg-blue-700 hover:bg-blue-800"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {currentUser
                ? (updateUserMutation.isPending ? "Salvando..." : "Salvar")
                : (createUserMutation.isPending ? "Criando..." : "Criar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para alterar senha */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              {isSelfUser(currentUser?.id)
                ? "Atualize sua senha."
                : `Alterar senha do usuário ${currentUser?.email || currentUser?.firstName || currentUser?.id }.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isSelfUser(currentUser?.id) && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordChangeForm.currentPassword || ""}
                  onChange={(e) => setPasswordChangeForm({...passwordChangeForm, currentPassword: e.target.value})}
                  placeholder="Digite sua senha atual"
                />
                {formErrors.currentPassword && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.currentPassword}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordChangeForm.newPassword || ""}
                onChange={(e) => setPasswordChangeForm({...passwordChangeForm, newPassword: e.target.value})}
                placeholder="Digite a nova senha"
              />
              {formErrors.newPassword && (
                <p className="text-sm text-red-500 mt-1">{formErrors.newPassword}</p>
              )}
            </div>
            
            {/* TODO: Add Confirm New Password Field */}

          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={changePasswordMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePassword}
              className="bg-blue-700 hover:bg-blue-800"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para adicionar/editar perfil (consolidated) */}
      <Dialog open={roleDialogOpen || editRoleDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRoleDialogOpen(false);
          setEditRoleDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentRole ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
            <DialogDescription>
              {currentRole ? "Atualize as informações do perfil." : "Configure as informações do novo perfil."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleNameFormDialog">Nome do Perfil</Label> {/* Changed ID to avoid conflict */}
                <Input
                  id="roleNameFormDialog"
                  value={roleForm.name || ""}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                  placeholder="Ex: Coordenador"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roleDescriptionFormDialog">Descrição</Label> {/* Changed ID */}
                <Input
                  id="roleDescriptionFormDialog"
                  value={roleForm.description || ""}
                  onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                  placeholder="Ex: Acesso à coordenação de frotas"
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-4">Permissões</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(JSON.parse(roleForm.permissions || '{}')).map((key) => (
                  <div className="flex items-center space-x-2" key={key}>
                    <Switch
                      id={`perm-${key}`}
                      checked={JSON.parse(roleForm.permissions || '{}')[key]}
                      onCheckedChange={(checked) => {
                        const currentPermissions = JSON.parse(roleForm.permissions || '{}');
                        currentPermissions[key] = checked;
                        setRoleForm({...roleForm, permissions: JSON.stringify(currentPermissions) });
                      }}
                    />
                    <Label htmlFor={`perm-${key}`} className="flex items-center space-x-2 capitalize">
                      {/* TODO: Map permission keys to icons and friendly names if possible */}
                      {/* e.g. <Users className="h-4 w-4 text-blue-700" /> */}
                      <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                    </Label>
                  </div>
                ))}
              </div>
               {formErrors.permissions && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.permissions}</p>
                )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRoleDialogOpen(false); setEditRoleDialogOpen(false); }}
              disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={currentRole ? handleUpdateRole : handleSaveRole}
              className="bg-blue-700 hover:bg-blue-800"
              disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
            >
              {currentRole
                ? (updateRoleMutation.isPending ? "Salvando..." : "Salvar Alterações")
                : (createRoleMutation.isPending ? "Criando..." : "Criar Perfil")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}