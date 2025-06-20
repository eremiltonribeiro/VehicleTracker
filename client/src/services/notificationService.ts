import { Notification } from '@/contexts/NotificationContext';

// Notification service for automated notifications
export class NotificationService {
  private static instance: NotificationService;
  private addNotificationFn: ((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void) | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setAddNotificationFn(fn: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void) {
    this.addNotificationFn = fn;
  }

  // Vehicle-related notifications
  notifyVehicleAdded(vehicleName: string) {
    this.addNotificationFn?.({
      title: 'Veículo Cadastrado',
      message: `O veículo "${vehicleName}" foi cadastrado com sucesso.`,
      type: 'success',
      actionLabel: 'Ver Veículos',
      actionUrl: '/cadastros',
    });
  }

  notifyVehicleMaintenanceDue(vehicleName: string, maintenanceType: string) {
    this.addNotificationFn?.({
      title: 'Manutenção Vencida',
      message: `O veículo "${vehicleName}" precisa de ${maintenanceType}.`,
      type: 'warning',
      actionLabel: 'Ver Detalhes',
      actionUrl: '/veiculos',
    });
  }

  // Fuel-related notifications
  notifyFuelRecordAdded(driverName: string, liters: number) {
    this.addNotificationFn?.({
      title: 'Registro de Combustível',
      message: `${driverName} registrou ${liters}L de combustível.`,
      type: 'info',
      actionLabel: 'Ver Registros',
      actionUrl: '/registros',
    });
  }

  notifyLowFuelEfficiency(vehicleName: string, efficiency: number) {
    this.addNotificationFn?.({
      title: 'Eficiência Baixa',
      message: `O veículo "${vehicleName}" está com eficiência baixa: ${efficiency}km/L.`,
      type: 'warning',
      actionLabel: 'Ver Relatório',
      actionUrl: '/relatorios',
    });
  }

  // Driver-related notifications
  notifyDriverAdded(driverName: string) {
    this.addNotificationFn?.({
      title: 'Motorista Cadastrado',
      message: `O motorista "${driverName}" foi cadastrado com sucesso.`,
      type: 'success',
      actionLabel: 'Ver Motoristas',
      actionUrl: '/cadastros',
    });
  }

  notifyDriverLicenseExpiring(driverName: string, daysLeft: number) {
    this.addNotificationFn?.({
      title: 'CNH Vencendo',
      message: `A CNH de "${driverName}" vence em ${daysLeft} dias.`,
      type: 'warning',
      actionLabel: 'Ver Detalhes',
      actionUrl: '/cadastros',
    });
  }

  // System notifications
  notifySystemUpdate(version: string) {
    this.addNotificationFn?.({
      title: 'Sistema Atualizado',
      message: `Sistema atualizado para a versão ${version}.`,
      type: 'info',
    });
  }

  notifyDataBackup() {
    this.addNotificationFn?.({
      title: 'Backup Realizado',
      message: 'Backup dos dados realizado com sucesso.',
      type: 'success',
    });
  }

  notifyOfflineMode() {
    this.addNotificationFn?.({
      title: 'Modo Offline',
      message: 'Aplicativo funcionando offline. Dados serão sincronizados quando voltar online.',
      type: 'warning',
    });
  }

  notifyOnlineMode() {
    this.addNotificationFn?.({
      title: 'Conectado',
      message: 'Conexão restabelecida. Dados sincronizados.',
      type: 'success',
    });
  }

  // Error notifications
  notifyError(title: string, message: string) {
    this.addNotificationFn?.({
      title,
      message,
      type: 'error',
    });
  }

  // Generic notification
  notify(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    this.addNotificationFn?.(notification);
  }
}

export const notificationService = NotificationService.getInstance();
