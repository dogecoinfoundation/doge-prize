import { NextResponse } from 'next/server';
import { makeRPCCall } from '@/lib/dogecoin';

// Get the balance for the wallet
export async function GET(request: Request) {
  const url = new URL(request.url);
  const timestamp = url.searchParams.get('t');
  
  console.log(`[${new Date().toISOString()}] Balance API called with timestamp: ${timestamp}`);
  
  try {
    const startTime = Date.now();
    
    // Get available balance (confirmed transactions, minconf=1)
    const availableBalance = await makeRPCCall('getbalance', ['*', 1]);
    
    // Get total balance including unconfirmed (minconf=0)
    const totalBalance = await makeRPCCall('getbalance', ['*', 0]);
    
    // Calculate pending balance (unconfirmed transactions)
    const pendingBalance = totalBalance - availableBalance;
    
    // Get all addresses from getaddressesbyaccount ""
    const addresses = await makeRPCCall('getaddressesbyaccount', ['']);
    
    // Get blockchain info for additional debugging
    let blockchainInfo = null;
    try {
      blockchainInfo = await makeRPCCall('getblockchaininfo', []);
    } catch (error) {
      console.warn('Could not fetch blockchain info:', error);
    }
    
    const responseTime = Date.now() - startTime;
    const currentTime = new Date().toISOString();
    
    console.log(`[${currentTime}] Balance API response: available=${availableBalance}, pending=${pendingBalance}, total=${totalBalance}`);
    
    return NextResponse.json({
      success: true,
      availableBalance,
      pendingBalance,
      totalBalance,
      addresses: addresses || [],
      lastUpdated: currentTime,
      responseTime: `${responseTime}ms`,
      blockHeight: blockchainInfo?.blocks || null,
      syncProgress: blockchainInfo?.verificationprogress || null,
    });
  } catch (error: any) {
    const currentTime = new Date().toISOString();
    console.error(`[${currentTime}] Error getting wallet info:`, error.message);
    return NextResponse.json(
      { 
        error: `Failed to get wallet info: ${error.message}`,
        lastUpdated: currentTime,
        success: false
      },
      { status: 500 }
    );
  }
} 