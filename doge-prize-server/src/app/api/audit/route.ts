import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as 'PRIZE' | 'REDEMPTION_CODE' | undefined;
    const entityId = searchParams.get('entityId') ? parseInt(searchParams.get('entityId')!) : undefined;

    const logs = await getAuditLogs(entityType, entityId);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
} 