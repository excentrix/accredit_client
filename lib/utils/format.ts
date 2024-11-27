// lib/utils/format.ts
import { format, formatDistance } from "date-fns";
import { DATE_FORMAT } from "@/config/constants";

export function formatDate(date: string | Date): string {
  return format(new Date(date), DATE_FORMAT);
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), `${DATE_FORMAT} HH:mm`);
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
