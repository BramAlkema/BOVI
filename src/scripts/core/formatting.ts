/**
 * BOVI Formatting Utilities
 * Number, currency, and text formatting helpers
 */

/**
 * Formatting utilities
 */
export const fmt = {
  currency: (n: number): string => `€${n.toFixed(2)}`,
  lts: (n: number): string => `€LTS ${n.toFixed(2)}`,
  percentage: (n: number): string => `${n.toFixed(1)}%`,
  number: (n: number): string => n.toLocaleString()
};