import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to BRL
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  
  // If value is in cents, convert to reais
  const amount = value >= 100 ? value / 100 : value;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

// Format date to Brazilian format (DD/MM/YYYY)
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  
  let dateObj: Date;
  
  if (typeof date === "string") {
    dateObj = new Date(date);
  } else if (typeof date === "number") {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    return "";
  }
  
  return dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Get a display text for the registration type
export function getRegistrationTypeText(type: string): string {
  switch (type) {
    case "fuel":
      return "Abastecimento";
    case "maintenance":
      return "Manutenção";
    case "trip":
      return "Viagem";
    default:
      return "Desconhecido";
  }
}

// Get a color for the registration type
export function getRegistrationTypeColor(type: string): {
  bg: string;
  text: string;
  icon: string;
} {
  switch (type) {
    case "fuel":
      return {
        bg: "bg-amber-500",
        text: "text-white",
        icon: "text-xl mb-1"
      };
    case "maintenance":
      return {
        bg: "bg-green-600",
        text: "text-white",
        icon: "text-xl mb-1"
      };
    case "trip":
      return {
        bg: "bg-blue-600",
        text: "text-white",
        icon: "text-xl mb-1"
      };
    default:
      return {
        bg: "bg-gray-500",
        text: "text-white",
        icon: "text-xl mb-1"
      };
  }
}

export const formatDateTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('pt-BR')
}

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('pt-BR')
}

export const validateBrazilianPhone = (phone: string): boolean => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
  return phoneRegex.test(phone)
}

export const validatePlate = (plate: string): boolean => {
  // Brazilian license plate format: ABC-1234 or ABC1D23 (Mercosul)
  const plateRegex = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/
  return plateRegex.test(plate)
}

export const validateCPF = (cpf: string): boolean => {
  // Basic CPF validation
  const cleanCPF = cpf.replace(/\D/g, '')
  if (cleanCPF.length !== 11) return false
  
  // Check for repeated digits
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  return true
}

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export const calculateFuelEfficiency = (liters: number, distance: number): number => {
  if (liters === 0) return 0
  return distance / liters
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}


