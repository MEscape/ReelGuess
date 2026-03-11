import { clsx, type ClassValue } from 'clsx'
import { twMerge }               from 'tailwind-merge'

/**
 * Merges Tailwind class names, resolving conflicts via `tailwind-merge`.
 *
 * @example
 * ```ts
 * cn('px-4 py-2', condition && 'bg-red-500', className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}