import { NextResponse } from 'next/server';
import { makeRPCCall } from '@/lib/dogecoin';

// Get the balance for the wallet
export async function GET() {
  try {
    // Get available balance (confirmed transactions, minconf=1)
    const availableBalance = await makeRPCCall('getbalance', ['*', 1]);
    
    // Get total balance including unconfirmed (minconf=0)
    const totalBalance = await makeRPCCall('getbalance', ['*', 0]);
    
    // Calculate pending balance (unconfirmed transactions)
    const pendingBalance = totalBalance - availableBalance;
    
    // Get all addresses from getaddressesbyaccount ""
    const addresses = await makeRPCCall('getaddressesbyaccount', ['']);
    
    return NextResponse.json({
      success: true,
      availableBalance,
      pendingBalance,
      totalBalance,
      addresses: addresses || [],
    });
  } catch (error: any) {
    console.error('Error getting wallet info:', error.message);
    return NextResponse.json(
      { error: `Failed to get wallet info: ${error.message}` },
      { status: 500 }
    );
  }
} 