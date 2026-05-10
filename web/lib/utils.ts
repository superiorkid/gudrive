import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, locale?: string) {
  if (bytes === 0) {
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "byte",
    }).format(0)
  }

  const k = 1024
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unitIndex = Math.min(i, units.length - 1)

  const value = bytes / Math.pow(k, unitIndex)
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: units[unitIndex],
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDate(dateString: string) {
  const compatibleString = dateString.replace(/(\.\d{3})\d+Z$/, "$1Z")
  const date = new Date(compatibleString)
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export const formatLabel = (segment: string) => {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}
