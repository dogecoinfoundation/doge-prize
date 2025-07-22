export interface RedemptionResponse {
  valid: boolean;
  error?: string;
  message?: string;
  prize?: Prize;
}

export interface Prize {
  id: number;
  amount: number;
  status: string;
  redemptionCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SweepResponse {
  success: boolean;
  message?: string;
}

export interface TransactionResult {
  txid: string;
  amount?: number;
  fee?: number;
  change?: number;
}

export interface TransactionResponse {
  success: boolean;
  message?: string;
  transactionHash?: string;
}

export interface ServerConfig {
  title?: string;
  subtitle?: string;
  pageTitle?: string;
  pageDescription?: string;
  prizeHeading?: string;
  serverHeading?: string;
  serverPlaceholder?: string;
  redemptionCodeHeading?: string;
  redemptionCodePlaceholder?: string;
  redeemButtonText?: string;
  footerText?: string;
  footerTextPosition?: 'above' | 'below';
  footerImage?: string;
  footerUrl?: string;
  backgroundImage?: string;
  logoImage?: string;
  showWave?: boolean;
  panelAlignment?: 'left' | 'center' | 'right';
}

export interface HelloResponse {
  valid: boolean;
  hasCustomConfig?: boolean;
  config?: ServerConfig;
}

import { getServerUrl } from './constants';

export async function hello(serverIp: string): Promise<HelloResponse> {
  try {
    // Construct the server URL properly
    const serverUrl = getServerUrl(serverIp);
    
    // Make a GET request to the correct API endpoint
    const response = await fetch(`${serverUrl}/api/hello`, {
      method: 'GET',
    });

    if (!response.ok) {
      return { valid: false };
    }

    //A server config file could also be returned here
    // Try to parse as JSON first (new format with config)
    try {
      const data = await response.json();
      if (data.message === 'hello') {
        return {
          valid: true,
          hasCustomConfig: data.hasCustomConfig || false,
          config: data.config || undefined,
        };
      }
    } catch {
      // Fallback to old text format
      const text = await response.text();
      return { valid: text === 'hello' };
    }

    return { valid: false };
  } catch (error) {
    console.error('Error checking server:', error);
    // If we catch an error, the request failed
    return { valid: false };
  }
}

export async function redeemCode(serverIp: string, code: string): Promise<RedemptionResponse> {
  try {
    // Construct the server URL properly
    const serverUrl = getServerUrl(serverIp);
    
    const response = await fetch(`${serverUrl}/api/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ redemptionCode: code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        valid: false,
        error: errorData.error || 'Failed to redeem code',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error redeeming code:', error);
    return {
      valid: false,
      error: 'Network error',
    };
  }
}

export async function submitTransaction(serverIp: string, redemptionCode: string, walletAddress: string): Promise<TransactionResponse> {
  try {
    // Construct the server URL properly
    const serverUrl = getServerUrl(serverIp);
    
    const response = await fetch(`${serverUrl}/api/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ redemptionCode, walletAddress }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to submit transaction',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message,
      transactionHash: data.transactionHash,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error',
    };
  }
} 