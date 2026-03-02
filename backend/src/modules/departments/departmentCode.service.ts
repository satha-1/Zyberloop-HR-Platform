import { Department } from './department.model';

/**
 * Generate prefix from department name
 * Takes the first letter of each significant word (ignoring filler words)
 */
export function generatePrefix(name: string): string {
  const fillerWords = new Set(['and', 'of', 'the', 'for', 'in', 'on', 'at', 'to', 'a', 'an']);
  
  const words = name
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0 && !fillerWords.has(w.toLowerCase()));

  if (words.length === 0) {
    return '';
  }

  const initials = words.map(w => {
    // Handle special characters - take first alphanumeric character
    const match = w.match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : '';
  }).filter(char => char.length > 0);

  const prefix = initials.join('');

  // Limit prefix length to 4 characters max (can be adjusted)
  return prefix.slice(0, 4);
}

/**
 * Generate the next department code for a given department name
 * Format: PREFIX-NNN (e.g., HR-001, IT-002)
 */
export async function generateDepartmentCode(departmentName: string): Promise<string> {
  const prefix = generatePrefix(departmentName);
  
  if (!prefix) {
    throw new Error('Cannot generate prefix from empty department name');
  }

  // Find the latest code for this prefix
  // Query for codes matching the pattern PREFIX-NNN
  const existingDepartments = await Department.find({
    code: { $regex: `^${prefix}-\\d+$` }
  })
    .sort({ code: -1 })
    .limit(1)
    .select('code');

  let nextNumber = 1;

  if (existingDepartments.length > 0) {
    const lastCode = existingDepartments[0].code; // e.g., "HR-007"
    const parts = lastCode.split('-');
    if (parts.length === 2) {
      const lastNumberStr = parts[1];
      const lastNumber = parseInt(lastNumberStr, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }

  // Pad to 3 digits
  const numberStr = String(nextNumber).padStart(3, '0');
  return `${prefix}-${numberStr}`;
}
