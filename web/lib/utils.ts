import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const numberFormatCache = new Map<string, Intl.NumberFormat>()
const dateFormatCache = new Map<string, Intl.DateTimeFormat>()

function getNumberFormatter(
  locale: string | undefined,
  options: Intl.NumberFormatOptions
) {
  const key = `${locale ?? "default"}-${JSON.stringify(options)}`
  let formatter = numberFormatCache.get(key)

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options)
    numberFormatCache.set(key, formatter)
  }

  return formatter
}

function getDateFormatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions
) {
  const key = `${locale ?? "default"}-${JSON.stringify(options)}`
  let formatter = dateFormatCache.get(key)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    dateFormatCache.set(key, formatter)
  }

  return formatter
}

export function formatBytes(bytes: number, locale?: string) {
  const k = 1024
  const units: Intl.NumberFormatOptions["unit"][] = [
    "byte",
    "kilobyte",
    "megabyte",
    "gigabyte",
    "terabyte",
  ]

  if (bytes === 0) {
    return getNumberFormatter(locale, {
      style: "unit",
      unit: "byte",
    }).format(0)
  }

  if (bytes < k) {
    return getNumberFormatter(locale, {
      style: "unit",
      unit: "byte",
    }).format(bytes)
  }

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unitIndex = Math.min(i, units.length - 1)

  const value = bytes / Math.pow(k, unitIndex)

  return getNumberFormatter(locale, {
    style: "unit",
    unit: units[unitIndex],
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDate(dateString: string, locale: string = "en-US") {
  const compatibleString = dateString.replace(/(\.\d{3})\d+Z$/, "$1Z")

  const date = new Date(compatibleString)

  return getDateFormatter(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export const formatLabel = (segment: string) => {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}
