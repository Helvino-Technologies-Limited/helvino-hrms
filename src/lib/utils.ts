import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function generateEmployeeCode(count: number): string {
  return `HTL${String(count + 1).padStart(4, '0')}`
}

export function calculatePAYE(gross: number): number {
  if (gross <= 24000) return gross * 0.1
  if (gross <= 32333) return 2400 + (gross - 24000) * 0.25
  if (gross <= 500000) return 4483 + (gross - 32333) * 0.3
  if (gross <= 800000) return 144233 + (gross - 500000) * 0.325
  return 241733 + (gross - 800000) * 0.35
}

export function calculateNHIF(gross: number): number {
  if (gross < 6000) return 150
  if (gross < 8000) return 300
  if (gross < 12000) return 400
  if (gross < 15000) return 500
  if (gross < 20000) return 600
  if (gross < 25000) return 750
  if (gross < 30000) return 850
  if (gross < 35000) return 900
  if (gross < 40000) return 950
  if (gross < 45000) return 1000
  if (gross < 50000) return 1100
  if (gross < 60000) return 1200
  if (gross < 70000) return 1300
  if (gross < 80000) return 1400
  if (gross < 90000) return 1500
  if (gross < 100000) return 1600
  return 1700
}

export function calculateNSSF(gross: number): number {
  const tierI = Math.min(gross, 6000) * 0.06
  const tierII = Math.min(Math.max(gross - 6000, 0), 12000) * 0.06
  return tierI + tierII
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}
