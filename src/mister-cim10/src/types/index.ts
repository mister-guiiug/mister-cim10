/**
 * Types TypeScript pour mister-cim10
 */

export interface ICD10Code {
  code: string
  description: string
  chapter?: string
  category?: string
}

export interface AnalysisResult {
  code: string
  description: string
  severity: 'low' | 'medium' | 'high'
  matchedKeywords: string[]
}

export interface AppSettings {
  theme: 'light' | 'dark'
  language: 'fr' | 'en'
  fontSize: 'small' | 'medium' | 'large'
  autoSave: boolean
  notifications: boolean
}

export interface SearchHistory {
  id: string
  query: string
  timestamp: number
  results: number
}

export interface FavoriteCode {
  code: string
  description: string
  addedAt: number
}

export interface ExportData {
  exportDate: string
  version: string
  codes: ICD10Code[]
  settings: AppSettings
}

export interface StorageData {
  settings: AppSettings
  history: SearchHistory[]
  favorites: FavoriteCode[]
  lastUpdate: number
}

export interface Route {
  path: string
  title: string
  component: () => void
}

export interface MenuItem {
  id: string
  label: string
  icon?: string
  action?: () => void
  children?: MenuItem[]
}

export interface DialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export interface ToastNotification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export interface AnalysisReport {
  id: string
  symptoms: string[]
  possibleCodes: AnalysisResult[]
  timestamp: number
  confidence: number
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf'
  includeHistory: boolean
  includeFavorites: boolean
  anonymize: boolean
}