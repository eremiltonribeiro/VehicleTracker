import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { UserPlus, Trash2, Edit } from "lucide-react";

// Tipos
interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData.role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      setLocation("/");
    } else {
      // Carregar lista de usuários
      loadUsers();
    }
  }, [setLocation, toast]);
  
  // Simulação de carregamento de usuários (em um sistema real, isso viria do servidor)
  const loadUsers = () => {
    setIsLoading(true);
    
    // Lista de usuários simulada
    const mockUsers: User[] = [
      { id: "1", username: "admin", name: "Administrador", role: "admin" },
      { id: "2", username: "motorista1", name: "João Motorista", role: "user" },
      { id: "3", username: "gerente1", name: "Carlos Gerente", role: "manager" },
    ];
    
    // Simulando um delay de carregamento
    setTimeout(() => {
      setUsers(mockUsers);
      setIsLoading(false);
    }, 500);
  };
  
  // Abrir diálogo para novo usuário
  const handleAddUser = () => {
    setCurrentUser(null);
    setUsername("");
    setPassword("");
    setName("");
    setRole("user");
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar usuário
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setUsername(user.username);
    setPassword(""); // Não preenchemos a senha na edição
    setName(user.name);
    setRole(user.role);
    setDialogOpen(true);
  };
  
  // Salvar usuário (novo ou edição)
  const handleSaveUser = () => {
    if (!username || !name || (currentUser === null && !password)) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    if (currentUser === null) {
      // Novo usuário
      const newUser: User = {
        id: Date.now().toString(), // Simulando um ID
        username,
        name,
        role,
      };
      
      // Armazenar as credenciais do usuário (em produção seria no servidor)
      const storedUsers = JSON.parse(localStorage.getItem("appUsers") || "{}");
      storedUsers[username] = {
        id: newUser.id,
        password: password,
        name: name,
        role: role
      };
      localStorage.setItem("appUsers", JSON.stringify(storedUsers));
      setUsers([...users, newUser]);
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });
    } else {
      // Edição de usuário existente
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, username, name, role } : u
      );
      setUsers(updatedUsers);
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });
    }
    
    setDialogOpen(false);
  };
  
  // Deletar usuário
  const handleDeleteUser = (userId: string) => {
    if (userId === "1") {
      toast({
        title: "Operação não permitida",
        description: "O usuário administrador principal não pode ser removido",
        variant: "destructive",
      });
      return;
    }
    
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    toast({
      title: "Sucesso",
      description: "Usuário removido com sucesso",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-900">Gerenciamento de Usuários</h2>
        <Button onClick={handleAddUser} className="bg-blue-800 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando usuários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome de Usuário</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      {user.role === "admin" ? "Administrador" : 
                       user.role === "manager" ? "Gerente" : "Usuário"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleEditUser(user)}
                          className="h-8 w-8 text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-8 w-8 text-red-700"
                          disabled={user.id === "1"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de criação/edição de usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentUser ? "Editar Usuário" : "Criar Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {currentUser 
                ? "Atualize as informações do usuário abaixo." 
                : "Preencha os campos para criar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite o nome de usuário"
              />
            </div>
            
            {currentUser === null && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={role}
                onValueChange={setRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveUser}
              className="bg-blue-800 hover:bg-blue-700"
            >
              {currentUser ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}