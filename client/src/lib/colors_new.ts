// Cores baseadas na identidade visual moderna da aplicação
export const brandColors = {
  // Cores primárias
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Azul principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Cores secundárias (dourado/âmbar)
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Dourado principal
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },

  // Status colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },

  // Neutros
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    secondary: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    hero: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)',
    card: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
  }
}

// Cores legadas para compatibilidade
export const legacyColors = {
  navyBlue: brandColors.primary[800],
  gold: brandColors.secondary[500],
  darkBlue: brandColors.primary[700],
  mediumBlue: brandColors.primary[600],
  lightBlue: brandColors.primary[400],
  darkGold: brandColors.secondary[600],
  mediumGold: brandColors.secondary[400],
  lightGold: brandColors.secondary[300],
  white: "#FFFFFF",
  lightGray: brandColors.gray[50],
  mediumGray: brandColors.gray[200],
  darkGray: brandColors.gray[700]
}

// Utilitários de cores
export const colorUtils = {
  // Função para aplicar transparência
  withOpacity: (color: string, opacity: number) => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },
  
  // Classes Tailwind personalizadas
  tailwind: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-amber-500 hover:bg-amber-600 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100'
  }
}
