import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

interface CSVRow {
  code: string;
  type: string;
  amount: string;
}

// Parse CSV content
function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  const rows: CSVRow[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 3) {
      rows.push({
        code: columns[0].trim(),
        type: columns[1].trim(),
        amount: columns[2].trim()
      });
    }
  }
  
  return rows;
}

// Validate CSV row data
function validateRow(row: CSVRow, index: number): { valid: boolean; error?: string } {
  if (!row.code) {
    return { valid: false, error: `Row ${index + 1}: Code is required` };
  }
  
  if (!row.type || !['Random', 'Specific', 'Assigned'].includes(row.type)) {
    return { valid: false, error: `Row ${index + 1}: Type must be 'Random', 'Specific', or 'Assigned'` };
  }
  
  if (row.type === 'Specific' || row.type === 'Assigned') {
    if (!row.amount || isNaN(parseFloat(row.amount)) || parseFloat(row.amount) <= 0) {
      return { valid: false, error: `Row ${index + 1}: Valid amount is required for '${row.type}' type prizes` };
    }
  }
  
  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('csvFile') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV (.csv) file' },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in CSV file' },
        { status: 400 }
      );
    }

    // Validate all rows
    const validationErrors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const validation = validateRow(rows[i], i);
      if (!validation.valid) {
        validationErrors.push(validation.error!);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors found', details: validationErrors },
        { status: 400 }
      );
    }

    // Check for duplicate codes in the CSV
    const codes = rows.map(row => row.code);
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      return NextResponse.json(
        { error: `Duplicate codes found in CSV: ${duplicateCodes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for existing codes in database
    const existingPrizes = await prisma.prize.findMany({
      where: {
        redemptionCode: {
          in: codes
        }
      },
      select: {
        redemptionCode: true
      }
    });

    if (existingPrizes.length > 0) {
      const existingCodes = existingPrizes.map(p => p.redemptionCode);
      return NextResponse.json(
        { error: `Codes already exist in database: ${existingCodes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create prizes with proper type and amount handling
    const defaultRandomAmount = 0;
    const prizesToCreate = rows.map(row => ({
      redemptionCode: row.code,
      amount: row.type === 'Random' ? defaultRandomAmount : parseFloat(row.amount),
      status: 'Available' as const,
      type: row.type as 'Random' | 'Specific' | 'Assigned'
    }));

    const createdPrizes = await prisma.prize.createMany({
      data: prizesToCreate
    });

    // Log the bulk import
    await logAudit(
      'CREATE',
      'PRIZE',
      0, // Using 0 for bulk operations
      `Imported ${createdPrizes.count} prizes from CSV file: ${file.name}. Default amount for Random type: ${defaultRandomAmount}`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdPrizes.count} prizes`,
      count: createdPrizes.count
    });

  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV file' },
      { status: 500 }
    );
  }
} 