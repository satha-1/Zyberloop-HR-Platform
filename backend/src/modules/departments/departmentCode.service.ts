import { Department } from './department.model';
import { SequenceGenerator } from '../employees/sequenceGenerator.model';

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
 * Format: PREFIX-NNN (e.g., A-001, SD-002)
 * The number part (NNN) is globally unique across all departments, not per prefix
 */
export async function generateDepartmentCode(departmentName: string): Promise<string> {
  const prefix = generatePrefix(departmentName);
  
  if (!prefix) {
    throw new Error('Cannot generate prefix from empty department name');
  }

  // Get next global sequence number for all departments
  const updated = await SequenceGenerator.findOneAndUpdate(
    { key: 'department_code' },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  const nextNumber = updated.value;

  // Pad to 3 digits
  const numberStr = String(nextNumber).padStart(3, '0');
  return `${prefix}-${numberStr}`;
}
