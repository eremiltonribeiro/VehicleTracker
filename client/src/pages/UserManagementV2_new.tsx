import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash, 
  Shield, 
  Eye, 
  EyeOff, 
  UserCheck, 
  UserX,
  Mail,
  Key,
  Settings,
  Search,
  X,
  Crown,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { brandColors } from "@/lib/colors";

interface ApiUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  role?: ApiRole;
  isActive?: boolean;
}

interface ApiRole {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
}

export default function UserManagementV2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [userFormData, setUserFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    roleId: "",
    isActive: true
  });

  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<ApiUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.ok ? res.json() : [];
    },
  });

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<ApiRole[]>({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      return res.ok ? res.json() : [];
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Available permissions
  const availablePermissions = [
    { id: "view_vehicles", label: "Visualizar Veículos" },
    { id: "manage_vehicles", label: "Gerenciar Veículos" },
    { id: "view_drivers", label: "Visualizar Motoristas" },
    { id: "manage_drivers", label: "Gerenciar Motoristas" },
    { id: "view_registrations", label: "Visualizar Registros" },
    { id: "manage_registrations", label: "Gerenciar Registros" },
    { id: "view_reports", label: "Visualizar Relatórios" },
    { id: "export_reports", label: "Exportar Relatórios" },
    { id: "manage_users", label: "Gerenciar Usuários" },
    { id: "admin_full", label: "Administrador Total" }
  ];

  // User mutations
  const saveUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const url = formMode === "create" ? "/api/users" : `/api/users/${currentUser?.id}`;
      const method = formMode === "create" ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao salvar usuário");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso!",
        description: formMode === "create" ? "Usuário criado com sucesso." : "Usuário atualizado com sucesso.",
      });
      resetUserForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Falha ao excluir usuário");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário excluído com sucesso." });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Role mutations
  const saveRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleData),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao criar perfil");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Perfil criado com sucesso." });
      resetRoleForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const resetUserForm = () => {
    setUserFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      roleId: "",
      isActive: true
    });
    setFormMode("create");
    setCurrentUser(null);
    setIsFormVisible(false);
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: "",
      description: "",
      permissions: []
    });
  };

  const handleEditUser = (user: ApiUser) => {
    setCurrentUser(user);
    setUserFormData({
      email: user.email,
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      roleId: user.roleId?.toString() || "",
      isActive: user.isActive ?? true
    });
    setFormMode("edit");
    setIsFormVisible(true);
  };

  const handleDeleteUser = (user: ApiUser) => {
    deleteUserMutation.mutate(user.id);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData: any = {
      email: userFormData.email,
      firstName: userFormData.firstName,
      lastName: userFormData.lastName,
      roleId: parseInt(userFormData.roleId),
      isActive: userFormData.isActive
    };

    if (formMode === "create" && userFormData.password) {
      userData.password = userFormData.password;
    }

    saveUserMutation.mutate(userData);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRoleMutation.mutate(roleFormData);
  };

  const togglePermission = (permissionId: string) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
      case 'gerente':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operator':
      case 'operador':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: brandColors.primary[100] }}>
                  <Users className="h-8 w-8" style={{ color: brandColors.primary[600] }} />
                </div>
                Gestão de Usuários
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie usuários, permissões e controle de acesso
              </p>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <Card className="shadow-lg border-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <Users className="h-4 w-4" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger 
                  value="roles" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  <Shield className="h-4 w-4" />
                  Perfis e Permissões
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              {/* Users Tab */}
              <TabsContent value="users" className="mt-0">
                <div className="p-6">
                  {/* Users Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Usuários do Sistema</h3>
                      <p className="text-gray-600">
                        {filteredUsers.length} de {users.length} usuário(s) {searchTerm && 'encontrado(s)'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar usuários..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-80"
                        />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => setIsFormVisible(true)}
                        className="flex items-center gap-2"
                        style={{ backgroundColor: brandColors.primary[600] }}
                      >
                        <Plus className="h-4 w-4" />
                        Novo Usuário
                      </Button>
                    </div>
                  </div>

                  {/* User Form */}
                  {isFormVisible && (
                    <Card className="mb-6 border-2 border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                          {formMode === "create" ? "Novo Usuário" : "Editar Usuário"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleUserSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email*
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={userFormData.email}
                                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                                required
                              />
                            </div>

                            {formMode === "create" && (
                              <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                  <Key className="h-4 w-4" />
                                  Senha*
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={userFormData.password}
                                    onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                                    required={formMode === "create"}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 h-full px-3"
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="firstName">Nome</Label>
                              <Input
                                id="firstName"
                                value={userFormData.firstName}
                                onChange={(e) => setUserFormData(prev => ({ ...prev, firstName: e.target.value }))}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="lastName">Sobrenome</Label>
                              <Input
                                id="lastName"
                                value={userFormData.lastName}
                                onChange={(e) => setUserFormData(prev => ({ ...prev, lastName: e.target.value }))}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                Perfil
                              </Label>
                              <Select value={userFormData.roleId} onValueChange={(value) => setUserFormData(prev => ({ ...prev, roleId: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="isActive"
                                checked={userFormData.isActive}
                                onCheckedChange={(checked) => setUserFormData(prev => ({ ...prev, isActive: checked }))}
                              />
                              <Label htmlFor="isActive">Usuário ativo</Label>
                            </div>
                          </div>

                          <Separator />

                          <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={resetUserForm}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={saveUserMutation.isPending}>
                              {saveUserMutation.isPending ? "Salvando..." : formMode === "create" ? "Criar Usuário" : "Atualizar Usuário"}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Users Table */}
                  {usersLoading ? (
                    <div className="text-center py-8">Carregando usuários...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Comece criando o primeiro usuário"}
                      </p>
                      {!searchTerm && (
                        <Button onClick={() => setIsFormVisible(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Usuário
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500" />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                    </div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.role ? (
                                  <Badge variant="outline" className={getRoleBadgeColor(user.role.name)}>
                                    {user.role.name}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">Sem perfil</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.isActive !== false ? "default" : "secondary"}>
                                  {user.isActive !== false ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir o usuário <strong>{user.email}</strong>?
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteUser(user)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="mt-0">
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Perfis e Permissões</h3>
                    <p className="text-gray-600">
                      Configure os perfis de acesso e suas respectivas permissões
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Roles */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Perfis Existentes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {rolesLoading ? (
                          <div className="text-center py-4">Carregando perfis...</div>
                        ) : roles.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Shield className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p>Nenhum perfil cadastrado</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {roles.map((role) => (
                              <div key={role.id} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{role.name}</h4>
                                    {role.description && (
                                      <p className="text-sm text-gray-500">{role.description}</p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                                    {role.permissions?.length || 0} permissões
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Create New Role */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          Criar Novo Perfil
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleRoleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="roleName">Nome do Perfil*</Label>
                            <Input
                              id="roleName"
                              value={roleFormData.name}
                              onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Ex: Administrador, Operador"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="roleDescription">Descrição</Label>
                            <Input
                              id="roleDescription"
                              value={roleFormData.description}
                              onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Descrição do perfil"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Permissões</Label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                              {availablePermissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={permission.id}
                                    checked={roleFormData.permissions.includes(permission.id)}
                                    onChange={() => togglePermission(permission.id)}
                                    className="rounded"
                                  />
                                  <Label htmlFor={permission.id} className="text-sm">
                                    {permission.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button 
                            type="submit" 
                            disabled={saveRoleMutation.isPending}
                            className="w-full"
                          >
                            {saveRoleMutation.isPending ? "Criando..." : "Criar Perfil"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
