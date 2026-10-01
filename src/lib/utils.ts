import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp className, class sau thắng class trước cùng loại (như cn() của web) */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
