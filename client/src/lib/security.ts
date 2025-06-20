// Security utilities and validation functions for VehicleTracker
import { z } from 'zod';

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
}

// SQL injection prevention patterns
const SQL_INJECTION_PATTERNS = [
  /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\s+/i,
  /(\s|^)(OR|AND)\s+\d+\s*=\s*\d+/i,
  /(\s|^)(OR|AND)\s+\w+\s*=\s*\w+/i,
  /';/,
  /--/,
  /\/\*/,
  /\*\//,
  /xp_/i,
  /sp_/i,
];

export function hasSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// XSS prevention
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Secure random ID generation
export function generateSecureId(): string {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for older browsers
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Rate limiting for API calls
class RateLimiter {
  private calls: Map<string, number[]> = new Map();
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number = 100, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const calls = this.calls.get(key) || [];
    
    // Remove old calls outside the window
    const validCalls = calls.filter(call => now - call < this.windowMs);
    
    if (validCalls.length >= this.maxCalls) {
      return false;
    }
    
    validCalls.push(now);
    this.calls.set(key, validCalls);
    return true;
  }

  reset(key: string): void {
    this.calls.delete(key);
  }
}

export const apiRateLimiter = new RateLimiter(100, 60000); // 100 calls per minute

// Input validation schemas with security in mind
export const secureValidationSchemas = {
  // Basic string with length and content validation
  safeString: (minLength: number = 1, maxLength: number = 255) =>
    z.string()
      .min(minLength, `Mínimo ${minLength} caracteres`)
      .max(maxLength, `Máximo ${maxLength} caracteres`)
      .refine(val => !hasSQLInjection(val), 'Entrada inválida detectada')
      .transform(sanitizeInput),

  // Vehicle license plate with Brazilian format
  licensePlate: z.string()
    .regex(/^[A-Z]{3}-?\d{4}$|^[A-Z]{3}-?\d[A-Z]\d{2}$/, 'Formato de placa inválido')
    .transform(val => val.replace('-', '').toUpperCase()),

  // Phone number validation
  phoneNumber: z.string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Formato de telefone inválido')
    .transform(val => val.replace(/\D/g, '')),

  // CNH (Brazilian driver's license) validation
  cnh: z.string()
    .regex(/^\d{11}$/, 'CNH deve ter 11 dígitos')
    .refine(val => {
      // Simple CNH validation algorithm
      const digits = val.split('').map(Number);
      let sum = 0;
      
      for (let i = 0; i < 9; i++) {
        sum += digits[i] * (9 - i);
      }
      
      const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (firstDigit !== digits[9]) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += digits[i] * (9 - i);
      }
      
      const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      return secondDigit === digits[10];
    }, 'CNH inválida'),

  // Secure numeric values
  positiveNumber: z.number()
    .positive('Deve ser um número positivo')
    .finite('Número inválido')
    .safe('Número muito grande'),

  // Decimal with precision
  currency: z.number()
    .positive('Valor deve ser positivo')
    .multipleOf(0.01, 'Máximo 2 casas decimais')
    .max(999999.99, 'Valor muito alto'),

  // Date validation
  validDate: z.date()
    .refine(date => date <= new Date(), 'Data não pode ser futura')
    .refine(date => date >= new Date('1900-01-01'), 'Data muito antiga'),

  // Odometer reading
  odometer: z.number()
    .int('Deve ser um número inteiro')
    .min(0, 'Quilometragem não pode ser negativa')
    .max(9999999, 'Quilometragem muito alta'),

  // Fuel quantity
  fuelLiters: z.number()
    .positive('Quantidade deve ser positiva')
    .max(1000, 'Quantidade muito alta')
    .multipleOf(0.01, 'Máximo 2 casas decimais'),
};

// CSRF protection
export function generateCSRFToken(): string {
  return generateSecureId();
}

export function validateCSRFToken(token: string): boolean {
  // In a real implementation, this would validate against a server-side token
  return !!(token && token.length >= 16);
}

// Content Security Policy helpers
export function createCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

// Secure headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': createCSPHeader(),
};

// Data encryption utilities (for sensitive data)
export class DataEncryption {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = this.encoder.encode(data);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  }

  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    return this.decoder.decode(decrypted);
  }
}

// Session management
export class SessionManager {
  private static readonly SESSION_KEY = 'vt_session';
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  static createSession(userId: string): string {
    const sessionId = generateSecureId();
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return sessionId;
  }

  static validateSession(): boolean {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session has expired
      if (now - session.lastActivity > this.SESSION_DURATION) {
        this.clearSession();
        return false;
      }

      // Update last activity
      session.lastActivity = now;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static getSessionId(): string | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      return session.id;
    } catch {
      return null;
    }
  }
}

// Audit logging
export class AuditLogger {
  private static logs: Array<{
    timestamp: number;
    action: string;
    details: any;
    userId?: string;
  }> = [];

  static log(action: string, details: any, userId?: string): void {
    this.logs.push({
      timestamp: Date.now(),
      action,
      details,
      userId,
    });

    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // In a real implementation, you would send this to a secure logging service
    console.log('Audit Log:', { action, details, userId, timestamp: new Date() });
  }

  static getLogs(): Array<any> {
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }
}

// Security middleware for API calls
export function secureApiCall(url: string, options: RequestInit = {}): Promise<Response> {
  // Rate limiting check
  if (!apiRateLimiter.isAllowed(url)) {
    throw new Error('Rate limit exceeded');
  }

  // Add security headers
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': generateCSRFToken(),
    },
  };

  // Log the API call
  AuditLogger.log('API_CALL', { url, method: options.method || 'GET' });

  return fetch(url, secureOptions);
}
