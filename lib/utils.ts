import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化烹饪时间
export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}小时`
  }
  return `${hours}小时${remainingMinutes}分钟`
}

// 格式化营养信息
export function formatNutrition(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 验证食材名称
export function validateIngredient(ingredient: string): boolean {
  return ingredient.trim().length > 0 && ingredient.trim().length <= 50
}

// 清理食材列表
export function cleanIngredients(ingredients: string[]): string[] {
  return ingredients
    .map(ingredient => ingredient.trim())
    .filter(ingredient => validateIngredient(ingredient))
    .filter((ingredient, index, array) => array.indexOf(ingredient) === index) // 去重
}

// 格式化错误消息
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '发生了未知错误'
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

// 检查是否为有效的JSON字符串
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// 提取JSON字符串
export function extractJSON(text: string): string | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return jsonMatch ? jsonMatch[0] : null
}

// 安全的JSON解析
export function safeJSONParse<T = any>(str: string, fallback: T | null = null): T | null {
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

// 计算营养密度评分
export function calculateNutritionScore(nutrition: {
  calories: number
  protein: number
  fiber: number
  fat: number
}): number {
  // 简单的营养评分算法
  const proteinScore = Math.min(nutrition.protein / 20, 1) * 30
  const fiberScore = Math.min(nutrition.fiber / 10, 1) * 20
  const calorieScore = nutrition.calories > 800 ? 0 : (800 - nutrition.calories) / 800 * 30
  const fatScore = nutrition.fat > 30 ? 0 : (30 - nutrition.fat) / 30 * 20

  return Math.round(proteinScore + fiberScore + calorieScore + fatScore)
}
