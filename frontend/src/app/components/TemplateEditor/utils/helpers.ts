// Helper functions for template editor

export function mmToPx(mm: number): number {
  // 1mm = 3.779527559 pixels at 96 DPI
  return mm * 3.779527559;
}

export function pxToMm(px: number): number {
  return px / 3.779527559;
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateFieldKey(fieldType: string): string {
  return `field_${fieldType}_${Date.now()}`;
}
