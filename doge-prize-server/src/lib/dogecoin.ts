import axios from 'axios';

// Types
interface DogecoinRPCConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

interface TransactionResult {
  txid: string;
  amount?: number;
  fee?: number;
  change?: number;
}

interface WalletInfo {
  address: string;
  privateKey: string;
}

// RPC Configuration from Environment Variables
const DOGECOIN_RPC_CONFIG: DogecoinRPCConfig = {
  host: process.env.DOGECOIN_RPC_HOST || 'localhost',
  port: parseInt(process.env.DOGECOIN_RPC_PORT || '22555'),
  user: process.env.DOGECOIN_RPC_USER || '',
  password: process.env.DOGECOIN_RPC_PASSWORD || '',
};

// Base JSON-RPC Call
async function makeRPCCall(method: string, params: any[] = []): Promise<any> {
  const rpcUrl = `http://${DOGECOIN_RPC_CONFIG.host}:${DOGECOIN_RPC_CONFIG.port}`;

  try {
    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: '1.0',
        id: Date.now(),
        method,
        params,
      },
      {
        auth: {
          username: DOGECOIN_RPC_CONFIG.user,
          password: DOGECOIN_RPC_CONFIG.password,
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(`Dogecoin RPC: ${error.response.data.error.message}`);
    }
    throw error;
  }
}

// Create a new address
async function createNewAddress(label: string = ''): Promise<string> {
  return await makeRPCCall('getnewaddress', [label]);
}

// Dump private key for an address
async function dumpPrivKey(address: string): Promise<string> {
  return await makeRPCCall('dumpprivkey', [address]);
}

// Generate address + private key
async function createWalletWithKey(label: string = ''): Promise<WalletInfo> {
  const address = await createNewAddress(label);
  const privateKey = await dumpPrivKey(address);
  return { address, privateKey };
}

// Send DOGE after importing private key
async function sendDoge(
  privateKey: string,
  toAddress: string,
  amount: number
): Promise<TransactionResult> {
  try {
    // Import private key to wallet (non-rescan for speed)
    await makeRPCCall('importprivkey', [privateKey, '', false]);

    // Send transaction
    const txid: string = await makeRPCCall('sendtoaddress', [toAddress, amount]);
    return { txid };
  } catch (error: any) {
    throw new Error(`Send failed: ${error.message}`);
  }
}

// Send DOGE from wallet to destination address
async function sendDogeFromWallet(
  toAddress: string,
  amount: number
): Promise<TransactionResult> {
  try {
    // Send transaction directly from wallet
    const txid: string = await makeRPCCall('sendtoaddress', [toAddress, amount]);
    return { txid };
  } catch (error: any) {
    throw new Error(`Send failed: ${error.message}`);
  }
}

// Get current spendable balance for a specific address using UTXOs
async function getAddressBalance(address: string): Promise<number> {
  try {
    // Get unspent transaction outputs (UTXOs) for this specific address
    const unspentOutputs = await makeRPCCall('listunspent', [1, 9999999, [address]]);
    
    // Sum up the amounts to get the current spendable balance
    const balance = unspentOutputs.reduce((total: number, utxo: any) => total + (utxo.amount || 0), 0);
    
    return balance;
  } catch (error: any) {
    console.error(`Error getting balance for address ${address}:`, error.message);
    return 0;
  }
}

// Exports
export type { DogecoinRPCConfig, TransactionResult, WalletInfo };

export {
  DOGECOIN_RPC_CONFIG,
  makeRPCCall,
  createNewAddress,
  dumpPrivKey,
  createWalletWithKey,
  sendDoge,
  sendDogeFromWallet,
  getAddressBalance
};
