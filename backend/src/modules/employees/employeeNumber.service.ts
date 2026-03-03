import { Employee } from './employee.model';
import { Department } from '../departments/department.model';
import { SequenceGenerator } from './sequenceGenerator.model';
import mongoose from 'mongoose';

/**
 * Extract numeric identifier from department code
 * Examples: "HR-001" -> "001", "IT-002" -> "002", "FIN" -> "000"
 * If department code has numbers, extract them; otherwise use department sequence
 */
async function getDepartmentNumericId(departmentId: mongoose.Types.ObjectId): Promise<string> {
  const department = await Department.findById(departmentId).select('code');
  if (!department) {
    return '000'; // Default if department not found
  }

  // Extract numeric part from department code (e.g., "HR-001" -> "001")
  const numericMatch = department.code.match(/\d+/);
  if (numericMatch) {
    return numericMatch[0].padStart(3, '0').slice(-3);
  }

  // If no numeric part, use a hash-like approach based on department code
  // Convert first 3 characters to numbers (A=1, B=2, etc.)
  const code = department.code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  if (code.length >= 3) {
    const num = (code.charCodeAt(0) - 64) * 100 + 
                (code.charCodeAt(1) - 64) * 10 + 
                (code.charCodeAt(2) - 64);
    return String(num).padStart(3, '0').slice(-3);
  }

  // Fallback: use department sequence
  const deptSequence = await SequenceGenerator.findOneAndUpdate(
    { key: `dept_num_${departmentId}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  
  return String(deptSequence.value % 1000).padStart(3, '0');
}

/**
 * Generate random 3-digit number
 */
function generateRandomDigits(): string {
  return String(Math.floor(100 + Math.random() * 900)); // 100-999
}

/**
 * Get next sequential number for a department
 */
async function getNextSequentialForDepartment(departmentId: mongoose.Types.ObjectId): Promise<number> {
  const updated = await SequenceGenerator.findOneAndUpdate(
    { key: `emp_no_seq_${departmentId}` },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();
  return updated.value;
}

/**
 * Generate EMPNO in format: DDDSSSRRR
 * - DDD: Department numeric identifier (3 digits)
 * - SSS: Sequential number per department (3 digits)
 * - RRR: Random digits (3 digits)
 */
export async function generateEmployeeNumber(
  departmentId: mongoose.Types.ObjectId
): Promise<string> {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error('Invalid department ID');
  }

  // Get department numeric identifier
  const deptNum = await getDepartmentNumericId(departmentId);
  
  // Get sequential number for this department
  const sequential = await getNextSequentialForDepartment(departmentId);
  const sequentialStr = String(sequential).padStart(3, '0').slice(-3);
  
  // Generate random part
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const randomPart = generateRandomDigits();
    const empNo = `${deptNum}${sequentialStr}${randomPart}`;
    
    // Check uniqueness
    const exists = await Employee.exists({ 
      $or: [
        { empNo: empNo },
        { employeeNumber: empNo }
      ]
    });
    
    if (!exists) {
      return empNo;
    }
    
    attempts++;
  }
  
  // Fallback: use timestamp-based random if collisions occur
  const timestampPart = Date.now().toString().slice(-3);
  return `${deptNum}${sequentialStr}${timestampPart}`;
}

/**
 * Validate EMPNO format (9 digits)
 */
export function validateEmployeeNumber(empNo: string): boolean {
  return /^\d{9}$/.test(empNo);
}
