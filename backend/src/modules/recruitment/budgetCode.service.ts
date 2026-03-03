import { SequenceGenerator } from '../employees/sequenceGenerator.model';

/**
 * Generate the next budget code for a requisition
 * Format: BUD-NNN (e.g., BUD-001, BUD-002)
 * The number part (NNN) is globally unique and sequential
 */
export async function generateBudgetCode(): Promise<string> {
  // Get next global sequence number for budget codes
  const updated = await SequenceGenerator.findOneAndUpdate(
    { key: 'budget_code' },
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
  return `BUD-${numberStr}`;
}
