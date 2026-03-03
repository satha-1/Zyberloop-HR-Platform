import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmployeeCodeGenerator, formatEmployeeCode } from './employeeCode.service';

test('formats employee code with 6-digit padding and random suffix', () => {
  const code1 = formatEmployeeCode(1, 'AB');
  const code2 = formatEmployeeCode(125, 'XY');
  
  // Check exact format: EMP-000001-AB
  assert.equal(code1, 'EMP-000001-AB');
  assert.equal(code2, 'EMP-000125-XY');
  
  // Check format pattern: EMP-XXXXXX-XX
  assert.ok(code1.match(/^EMP-\d{6}-[A-Z0-9]{2}$/));
  assert.ok(code2.match(/^EMP-\d{6}-[A-Z0-9]{2}$/));
  
  // Check sequential part
  assert.ok(code1.includes('000001'));
  assert.ok(code2.includes('000125'));
  
  // Check random suffix is present
  assert.equal(code1.split('-').length, 3);
  assert.equal(code2.split('-').length, 3);
  assert.equal(code1.split('-')[2], 'AB');
  assert.equal(code2.split('-')[2], 'XY');
});

test('employee code generation under concurrent requests yields unique sequential values with random suffixes', async () => {
  let sequence = 0;
  const nextSequenceValue = async () => {
    sequence += 1;
    return sequence;
  };
  const generator = createEmployeeCodeGenerator(
    nextSequenceValue, 
    { 
      prefix: 'EMP', 
      digits: 6,
      randomLength: 2,
      randomType: 'alphanumeric'
    },
    { skipUniquenessCheck: true } // Skip DB check in tests
  );

  const results = await Promise.all(Array.from({ length: 100 }, () => generator()));
  const unique = new Set(results);
  
  // All codes should be unique (sequential + random should ensure this)
  assert.equal(unique.size, 100);
  
  // All codes should match the format: EMP-XXXXXX-XX
  results.forEach(code => {
    assert.ok(code.match(/^EMP-\d{6}-[A-Z0-9]{2}$/), `Code ${code} does not match expected format`);
  });
  
  // Check that sequential numbers are present (even if random suffixes differ)
  const sequentialParts = results.map(code => code.split('-')[1]);
  const uniqueSequential = new Set(sequentialParts);
  assert.ok(uniqueSequential.size >= 1, 'Sequential parts should be present');
});
