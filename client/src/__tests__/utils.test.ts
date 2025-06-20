import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, validateBrazilianPhone, validatePlate } from '../lib/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      const result1 = formatCurrency(12345)
      const result2 = formatCurrency(100000)
      const result3 = formatCurrency(0)
      const result4 = formatCurrency(null)
      
      expect(result1).toContain('R$')
      expect(result1).toContain('123,45')
      expect(result2).toContain('1.000,00')
      expect(result3).toContain('R$')
      expect(result3).toContain('0,00')
      expect(result4).toContain('R$')
      expect(result4).toContain('0,00')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-12-25')
      expect(formatDate(date)).toBe('25/12/2023')
      expect(formatDate('2023-12-25')).toBe('25/12/2023')
      expect(formatDate(1703462400000)).toBe('25/12/2023') // timestamp
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
      expect(formatDate('')).toBe('')
    })
  })

  describe('validateBrazilianPhone', () => {
    it('validates Brazilian phone numbers', () => {
      expect(validateBrazilianPhone('(11) 99999-9999')).toBe(true)
      expect(validateBrazilianPhone('(11) 9999-9999')).toBe(true)
      expect(validateBrazilianPhone('11999999999')).toBe(false)
      expect(validateBrazilianPhone('(11) 999-999')).toBe(false)
    })
  })

  describe('validatePlate', () => {
    it('validates Brazilian license plates', () => {
      expect(validatePlate('ABC-1234')).toBe(true)
      expect(validatePlate('ABC1D23')).toBe(true)
      expect(validatePlate('AB-1234')).toBe(false)
      expect(validatePlate('ABC-12345')).toBe(false)
      expect(validatePlate('123-ABCD')).toBe(false)
    })
  })
})
