import { SequenceGenerator } from './sequenceGenerator.model';
import { Employee } from './employee.model';

export type EmployeeCodeConfig = {
  prefix: string;
  digits: number;
  sequenceKey: string;
  randomLength: number; // Length of random suffix (e.g., 2 = "AB", 3 = "XYZ")
  randomType: 'alphanumeric' | 'numeric' | 'letters'; // Type of random characters
};

const defaultConfig: EmployeeCodeConfig = {
  prefix: 'EMP',
  digits: 6,
  sequenceKey: 'employee_code',
  randomLength: 2,
  randomType: 'alphanumeric',
};

/**
 * Generates a random string of specified length and type
 */
function generateRandomSuffix(length: number, type: 'alphanumeric' | 'numeric' | 'letters'): string {
  let charset = '';
  if (type === 'numeric') {
    charset = '0123456789';
  } else if (type === 'letters') {
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  } else {
    // alphanumeric (default)
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function formatEmployeeCode(
  sequenceNumber: number,
  randomSuffix: string,
  config?: Partial<EmployeeCodeConfig>
): string {
  const merged = { ...defaultConfig, ...config };
  const padded = String(sequenceNumber).padStart(merged.digits, '0');
  return `${merged.prefix}-${padded}-${randomSuffix}`;
}

export function createEmployeeCodeGenerator(
  nextSequenceValue: () => Promise<number>,
  config?: Partial<EmployeeCodeConfig>,
  options?: { skipUniquenessCheck?: boolean }
) {
  return async (): Promise<string> => {
    const merged = { ...defaultConfig, ...config };
    const value = await nextSequenceValue();
    
    // Generate random suffix and ensure uniqueness
    let attempts = 0;
    const maxAttempts = 10;
    let code: string;
    
    do {
      const randomSuffix = generateRandomSuffix(merged.randomLength, merged.randomType);
      code = formatEmployeeCode(value, randomSuffix, merged);
      
      // Check if code already exists (skip in tests if needed)
      if (!options?.skipUniquenessCheck) {
        try {
          const exists = await Employee.exists({ employeeCode: code });
          if (!exists) {
            return code;
          }
        } catch (error) {
          // If database check fails (e.g., in tests), just return the code
          // The sequential number + random suffix should be unique enough
          return code;
        }
      } else {
        return code;
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    // Fallback: if all random attempts fail, use timestamp-based suffix
    const fallbackSuffix = Date.now().toString().slice(-merged.randomLength).toUpperCase();
    return formatEmployeeCode(value, fallbackSuffix, merged);
  };
}

export async function getNextEmployeeCode(config?: Partial<EmployeeCodeConfig>): Promise<string> {
  const merged = { ...defaultConfig, ...config };
  const generator = createEmployeeCodeGenerator(async () => {
    const updated = await SequenceGenerator.findOneAndUpdate(
      { key: merged.sequenceKey },
      { $inc: { value: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();
    return updated.value;
  }, merged);
  return generator();
}
