import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Download, 
  Upload, 
  Smartphone, 
  Database,
  Bell,
  Palette,
  Globe,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useServiceWorker, isPWA, supportsPWA } from '@/hooks/useServiceWorker';
import { BackupManager } from '@/services/backupService';
import { useNotifications } from '@/contexts/NotificationContext';
import { notificationService } from '@/services/notificationService';
import { brandColors } from '@/lib/colors';
import { useBreakpoint, useIsMobile } from '@/lib/responsive';

export default function SystemSettings() {
  const { 
    isSupported: swSupported,
    isRegistered: swRegistered,
    isOnline,
    updateAvailable,
    canInstall,
    isPWAInstalled,
    installPWA,
    updateServiceWorker,
    syncData
  } = useServiceWorker();
  
  const { notifications, clearAll } = useNotifications();
  const { breakpoint } = useBreakpoint();
  const isMobile = useIsMobile();
  
  const [settings, setSettings] = useState({
    autoBackup: true,
    backupInterval: 24,
    pushNotifications: false,
    offlineMode: true,
    autoUpdate: true,
    darkMode: false,
    compactMode: false,
    language: 'pt-BR',
  });

  const [systemInfo, setSystemInfo] = useState({
    version: '2.0.0',
    buildDate: new Date().toLocaleDateString('pt-BR'),
    platform: isPWA() ? 'PWA' : 'Web',
    userAgent: navigator.userAgent,
  });

  const [backupStats, setBackupStats] = useState(BackupManager.getBackupStats());

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('vt_settings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }

    // Update backup stats
    setBackupStats(BackupManager.getBackupStats());

    // Setup notification service
    notificationService.setAddNotificationFn((notification) => {
      // This would be handled by the notification context
    });
  }, []);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('vt_settings', JSON.stringify(newSettings));

    // Apply setting-specific logic
    if (key === 'autoBackup' && value) {
      BackupManager.startAutoBackup(newSettings.backupInterval);
    } else if (key === 'autoBackup' && !value) {
      BackupManager.stopAutoBackup();
    }
  };

  const handleCreateBackup = async () => {
    try {
      await BackupManager.createBackup();
      setBackupStats(BackupManager.getBackupStats());
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const handleExportBackup = () => {
    const backups = BackupManager.getStoredBackups();
    if (backups.length > 0) {
      BackupManager.exportBackup(backups[0]); // Export most recent
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      BackupManager.importBackup(file)
        .then(backup => {
          console.log('Backup imported:', backup);
          notificationService.notify({
            title: 'Backup Importado',
            message: 'Arquivo de backup carregado com sucesso.',
            type: 'success',
          });
        })
        .catch(error => {
          console.error('Import failed:', error);
          notificationService.notifyError('Erro na Importação', 'Falha ao importar backup.');
        });
    }
  };

  const systemFeatures = [
    {
      name: 'PWA (Progressive Web App)',
      status: supportsPWA() && isPWAInstalled,
      description: 'Aplicativo funciona offline e pode ser instalado',
      icon: Smartphone,
      action: canInstall ? (
        <Button onClick={installPWA} size="sm">Instalar App</Button>
      ) : null,
    },
    {
      name: 'Service Worker',
      status: swSupported && swRegistered,
      description: 'Cache inteligente e funcionalidade offline',
      icon: Shield,
      action: updateAvailable ? (
        <Button onClick={updateServiceWorker} size="sm">Atualizar</Button>
      ) : null,
    },
    {
      name: 'Backup Automático',
      status: settings.autoBackup,
      description: 'Backup regular dos dados do sistema',
      icon: Database,
    },
    {
      name: 'Notificações',
      status: notifications.length > 0,
      description: 'Sistema de notificações em tempo real',
      icon: Bell,
    },
    {
      name: 'Responsividade',
      status: true,
      description: 'Interface adaptada para todos os dispositivos',
      icon: Smartphone,
    },
    {
      name: 'Segurança',
      status: true,
      description: 'Validação robusta e proteção contra ataques',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: brandColors.primary[600] }}>
            <Settings className="h-6 w-6" />
            Configurações do Sistema
          </h2>
          <p className="text-muted-foreground">
            Gerencie preferências, backup e funcionalidades avançadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <Badge variant="secondary">
            {systemInfo.platform}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="features">Recursos</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="about">Sobre</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferências Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Criar backup dos dados automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(value) => updateSetting('autoBackup', value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Intervalo de Backup (horas)</Label>
                <Input
                  type="number"
                  value={settings.backupInterval}
                  onChange={(e) => updateSetting('backupInterval', parseInt(e.target.value))}
                  min="1"
                  max="168"
                  className="w-32"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Offline</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir funcionamento sem conexão
                  </p>
                </div>
                <Switch
                  checked={settings.offlineMode}
                  onCheckedChange={(value) => updateSetting('offlineMode', value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atualização Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualizar automaticamente o aplicativo
                  </p>
                </div>
                <Switch
                  checked={settings.autoUpdate}
                  onCheckedChange={(value) => updateSetting('autoUpdate', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Management */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Backups</p>
                    <p className="text-2xl font-bold">{backupStats.backupCount}</p>
                  </div>
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tamanho Total</p>
                    <p className="text-2xl font-bold">
                      {(backupStats.totalSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Último Backup</p>
                    <p className="text-lg font-bold">
                      {backupStats.newestBackup ? 
                        backupStats.newestBackup.toLocaleDateString('pt-BR') : 
                        'Nunca'
                      }
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gerenciar Backups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCreateBackup}>
                  <Database className="h-4 w-4 mr-2" />
                  Criar Backup
                </Button>
                <Button variant="outline" onClick={handleExportBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <label>
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
                <Button
                  variant="outline"
                  onClick={syncData}
                  disabled={!isOnline}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Features */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full" style={{ 
                          backgroundColor: feature.status ? `${brandColors.success[500]}20` : `${brandColors.gray[500]}20` 
                        }}>
                          <IconComponent className="h-5 w-5" style={{ 
                            color: feature.status ? brandColors.success[500] : brandColors.gray[500] 
                          }} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{feature.name}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {feature.action}
                        <Badge variant={feature.status ? "default" : "secondary"}>
                          {feature.status ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* System Information */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Versão</Label>
                  <p className="text-lg">{systemInfo.version}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Build</Label>
                  <p className="text-lg">{systemInfo.buildDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plataforma</Label>
                  <p className="text-lg">{systemInfo.platform}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Breakpoint Atual</Label>
                  <p className="text-lg">{breakpoint} {isMobile ? "(Mobile)" : "(Desktop)"}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium">User Agent</Label>
                <p className="text-sm text-muted-foreground break-all">{systemInfo.userAgent}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Central de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {notifications.length} notificação(ões) no sistema
                </p>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Todas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Vehicle Tracker v{systemInfo.version}
              </CardTitle>
              <CardDescription>
                Sistema completo de gestão de frota e combustível
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Funcionalidades Principais:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Gestão completa de veículos, motoristas e postos</li>
                  <li>Registro e acompanhamento de consumo de combustível</li>
                  <li>Dashboard com análises e KPIs em tempo real</li>
                  <li>Relatórios avançados com filtros e exportação</li>
                  <li>Sistema offline com sincronização automática</li>
                  <li>Backup e restauração de dados</li>
                  <li>Interface responsiva e moderna</li>
                  <li>Progressive Web App (PWA)</li>
                  <li>Segurança avançada e validação robusta</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Tecnologias Utilizadas:</h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Node.js', 'SQLite', 'Drizzle ORM', 'Tailwind CSS', 'Vite', 'PWA'].map(tech => (
                    <Badge key={tech} variant="outline">{tech}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
