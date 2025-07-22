"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DbWarning } from '@/components/db-warning';
import { isValidDogecoinAddress } from '@/utils/dogecoin';
import { ServerConfig } from './components/ServerConfig';

// Type declaration for doge-qr custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'doge-qr': {
        address: string;
        amount: number;
        theme?: string;
      };
    }
  }
}

interface Prize {
  id: number;
  amount: number;
  status: string;
  redemptionCode: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface EditPrize {
  id: number;
  amount: string;
  status: string;
  redemptionCode: string;
  type: string;
}

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string | null;
  createdAt: string;
}

interface NewPrize {
  amount: string;
  redemptionCode: string;
  type: string;
}

interface WalletInfo {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  addresses: string[];
  lastUpdated?: string;
  responseTime?: string;
  blockHeight?: number | null;
  syncProgress?: number | null;
}

interface RequiredBalance {
  requiredBalance: number;
  activePrizesCount: number;
  specificPrizesBalance: number;
  activeRandomPrizesCount: number;
  prizePoolTotal: number;
  lastUpdated?: string;
  responseTime?: string;
}

interface PrizePoolEntry {
  id: number;
  amount: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [requiredBalance, setRequiredBalance] = useState<RequiredBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [newPrize, setNewPrize] = useState<NewPrize>({
    amount: '',
    redemptionCode: '',
    type: 'Specific',
  });
  const [editingPrize, setEditingPrize] = useState<EditPrize | null>(null);
  const [prizeError, setPrizeError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ show: boolean; address: string; amount: number }>({
    show: false,
    address: '',
    amount: 0,
  });
  const [addressModal, setAddressModal] = useState<{ show: boolean; address: string }>({
    show: false,
    address: '',
  });
  const [prizePool, setPrizePool] = useState<PrizePoolEntry[]>([]);
  const [newPoolEntry, setNewPoolEntry] = useState<{ amount: string; quantity: string }>({ amount: '', quantity: '' });
  const [editingPoolEntry, setEditingPoolEntry] = useState<PrizePoolEntry | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [prizeSortField, setPrizeSortField] = useState<'amount' | 'type' | 'status'>('amount');
  const [prizeSortDirection, setPrizeSortDirection] = useState<'asc' | 'desc'>('asc');
  const [poolSortField, setPoolSortField] = useState<'amount' | 'quantity'>('amount');
  const [poolSortDirection, setPoolSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeSection, setActiveSection] = useState<'main' | 'config' | 'logs'>('main');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    fetchData();

    const refreshInterval = setInterval(fetchData, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Load the doge-qr script when component mounts
    if (!document.querySelector('script[src="https://fetch.dogecoin.org/doge-qr.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://fetch.dogecoin.org/doge-qr.js';
      document.head.appendChild(script);
    }
  }, []);

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      const [prizesResponse, auditLogsResponse, walletResponse, requiredBalanceResponse, prizePoolResponse] = await Promise.all([
        fetch(`/api/prizes`),
        fetch(`/api/audit`),
        fetch(`/api/wallet/balance?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        }),
        fetch(`/api/prizes/required-balance?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        }),
        fetch(`/api/prize-pool`)
      ]);

      // Check if we got redirected to login page
      const contentType = prizesResponse.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        // Session expired, redirect to login
        router.push('/auth/signin');
        return;
      }

      if (!prizesResponse.ok || !auditLogsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const prizesData = await prizesResponse.json();
      const auditLogsData = await auditLogsResponse.json();
      
      // Handle wallet info response
      let walletData = null;
      if (walletResponse.ok) {
        walletData = await walletResponse.json();
      }
      
      // Handle required balance response
      let requiredBalanceData = null;
      if (requiredBalanceResponse.ok) {
        requiredBalanceData = await requiredBalanceResponse.json();
      }

      let prizePoolData = [];
      if (prizePoolResponse.ok) {
        prizePoolData = await prizePoolResponse.json();
      }

      setPrizes(prizesData);
      setAuditLogs(auditLogsData);
      setWalletInfo(walletData);
      setRequiredBalance(requiredBalanceData);
      setPrizePool(prizePoolData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    setRefreshingBalance(true);
    console.log('Starting balance refresh...');
    
    try {
      // Add cache-busting parameter to force fresh requests
      const timestamp = Date.now();
      console.log('Cache-busting timestamp:', timestamp);
      
      const walletResponse = await fetch(`/api/wallet/balance?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      const requiredBalanceResponse = await fetch(`/api/prizes/required-balance?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      console.log('Refresh balance - wallet response status:', walletResponse.status);
      console.log('Refresh balance - required balance response status:', requiredBalanceResponse.status);
      
      // Handle wallet info response
      let walletData = null;
      if (walletResponse.ok) {
        walletData = await walletResponse.json();
        console.log('New wallet data timestamp:', walletData?.lastUpdated);
        console.log('Available Balance:', walletData?.availableBalance);
        console.log('Pending Balance:', walletData?.pendingBalance);
      } else {
        console.error('Wallet response error:', walletResponse.status, walletResponse.statusText);
      }
      
      // Handle required balance response
      let requiredBalanceData = null;
      if (requiredBalanceResponse.ok) {
        requiredBalanceData = await requiredBalanceResponse.json();
        console.log('New required balance timestamp:', requiredBalanceData?.lastUpdated);
        console.log('Required Balance:', requiredBalanceData?.requiredBalance);
      } else {
        console.error('Required balance response error:', requiredBalanceResponse.status, requiredBalanceResponse.statusText);
      }

      console.log('Updating state with new balance data...');
      setWalletInfo(walletData);
      setRequiredBalance(requiredBalanceData);
      console.log('Balance refresh completed successfully!');
      
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh balance');
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleCreatePrize = async () => {
    if (
      (newPrize.type === 'Specific' && (!newPrize.amount.trim() || !newPrize.redemptionCode.trim())) ||
      (newPrize.type === 'Random' && !newPrize.redemptionCode.trim())
    ) {
      return;
    }

    try {
      const response = await fetch('/api/prizes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: newPrize.type === 'Specific' ? newPrize.amount : 0,
          redemptionCode: newPrize.redemptionCode,
          type: newPrize.type,
        }),
      });

      if (response.ok) {
        setNewPrize({ amount: '', redemptionCode: '', type: 'Specific' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating prize:', error);
    }
  };

  const handleRemovePrize = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this prize? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/prizes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove prize');
      }

      await fetchData();
    } catch (err) {
      console.error('Error removing prize:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const handleEditPrize = (prize: Prize) => {
    setEditingPrize({
      id: prize.id,
      amount: prize.amount.toString(),
      status: prize.status,
      redemptionCode: prize.redemptionCode,
      type: prize.type
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPrize) return;

    // Validate based on prize type
    if ((editingPrize.type === 'Specific' || editingPrize.type === 'Assigned') && !editingPrize.amount.trim()) {
      setPrizeError('Please enter an amount');
      return;
    }
    if (!editingPrize.redemptionCode.trim()) {
      setPrizeError('Please enter a redemption code');
      return;
    }
    setPrizeError(null);

    try {
      const response = await fetch(`/api/prizes/${editingPrize.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: (editingPrize.type === 'Specific' || editingPrize.type === 'Assigned') ? parseFloat(editingPrize.amount) : 0,
          redemptionCode: editingPrize.redemptionCode.trim(),
          status: editingPrize.status,
          type: editingPrize.type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prize');
      }

      await fetchData();
      setEditingPrize(null);
      setError(null);
    } catch (err) {
      console.error('Error updating prize:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating the prize');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrize(null);
    setPrizeError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newPrize.amount.trim() && newPrize.redemptionCode.trim()) {
      handleCreatePrize();
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvFile(file || null);
    setCsvError(null);
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      setCsvError('Please select a CSV file');
      return;
    }

    setCsvImporting(true);
    setCsvError(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await fetch('/api/prizes/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Success - refresh the prizes list
        await fetchData();
        setCsvFile(null);
        // Reset the file input
        const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Show success message (you could add a success state if needed)
        alert(`Successfully imported ${result.count} prizes!`);
      } else {
        setCsvError(result.error || 'Failed to import CSV');
        if (result.details && Array.isArray(result.details)) {
          setCsvError(result.error + '\n\nDetails:\n' + result.details.join('\n'));
        }
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      setCsvError('An error occurred while importing the CSV file');
    } finally {
      setCsvImporting(false);
    }
  };

  const handleWalletAddressClick = (address: string, amount: number) => {
    setQrModal({ show: true, address, amount });
    
    // Load the doge-qr script dynamically
    if (!document.querySelector('script[src="https://fetch.dogecoin.org/doge-qr.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://fetch.dogecoin.org/doge-qr.js';
      script.onload = () => {
        console.log('doge-qr script loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load doge-qr script');
      };
      document.head.appendChild(script);
    }
  };

  const closeQrModal = () => {
    setQrModal({ show: false, address: '', amount: 0 });
  };

  const handleAddressClick = (address: string) => {
    setAddressModal({ show: true, address });
    
    // Load the doge-qr script dynamically if not already loaded
    if (!document.querySelector('script[src="https://fetch.dogecoin.org/doge-qr.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://fetch.dogecoin.org/doge-qr.js';
      script.onload = () => {
        console.log('doge-qr script loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load doge-qr script');
      };
      document.head.appendChild(script);
    }
  };

  const closeAddressModal = () => {
    setAddressModal({ show: false, address: '' });
  };

  const handleAddPoolEntry = async () => {
    if (!newPoolEntry.amount.trim() || !newPoolEntry.quantity.trim()) return;
    try {
      const response = await fetch('/api/prize-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: newPoolEntry.amount, quantity: newPoolEntry.quantity }),
      });
      if (response.ok) {
        setNewPoolEntry({ amount: '', quantity: '' });
        fetchData();
      }
    } catch (error) {
      setPoolError('Failed to add prize pool entry');
    }
  };

  const handleEditPoolEntry = (entry: PrizePoolEntry) => {
    setEditingPoolEntry({ ...entry });
  };

  const handleSaveEditPoolEntry = async () => {
    if (!editingPoolEntry) return;
    try {
      const response = await fetch('/api/prize-pool', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPoolEntry.id,
          amount: editingPoolEntry.amount,
          quantity: editingPoolEntry.quantity,
        }),
      });
      if (response.ok) {
        setEditingPoolEntry(null);
        fetchData();
      }
    } catch (error) {
      setPoolError('Failed to update prize pool entry');
    }
  };

  const handleRemovePoolEntry = async (id: number) => {
    try {
      const response = await fetch(`/api/prize-pool?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      setPoolError('Failed to remove prize pool entry');
    }
  };

  const handleCancelEditPoolEntry = () => {
    setEditingPoolEntry(null);
  };

  const handlePrizeSort = (field: 'amount' | 'type' | 'status') => {
    if (prizeSortField === field) {
      setPrizeSortDirection(prizeSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setPrizeSortField(field);
      setPrizeSortDirection('asc');
    }
  };

  const handlePoolSort = (field: 'amount' | 'quantity') => {
    if (poolSortField === field) {
      setPoolSortDirection(poolSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setPoolSortField(field);
      setPoolSortDirection('asc');
    }
  };

  const sortedPrizes = [...prizes].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (prizeSortField) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return prizeSortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return prizeSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedPrizePool = [...prizePool].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (poolSortField) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return poolSortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return poolSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="relative">
          <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-red-500 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <DbWarning>
      <div className="min-h-screen bg-[#131315]">
        <div className="max-w-8xl mx-auto p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-700 text-red-200 rounded-lg flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-100"
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="relative mb-12">
            <div className="flex justify-between items-center">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative text-4xl font-bold text-white text-center mb-2"
              >
                Doge Prize Admin
              </motion.h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#580DA9] text-white rounded-lg hover:bg-[#4A0B8F] transition-colors"
              >
                Logout
              </button>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-white text-2xl mt-8"
            >
              Manage your prizes and redemption codes
            </motion.p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveSection('main')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeSection === 'main'
                  ? 'bg-[#580DA9] text-white'
                  : 'bg-[#201F1D] text-gray-300 hover:text-white border border-[#333230]'
              }`}
            >
              Prize Dashboard
            </button>
            <button
              onClick={() => setActiveSection('config')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeSection === 'config'
                  ? 'bg-[#580DA9] text-white'
                  : 'bg-[#201F1D] text-gray-300 hover:text-white border border-[#333230]'
              }`}
            >
              Server Configuration
            </button>
            <button
              onClick={() => setActiveSection('logs')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeSection === 'logs'
                  ? 'bg-[#580DA9] text-white'
                  : 'bg-[#201F1D] text-gray-300 hover:text-white border border-[#333230]'
              }`}
            >
              Logs
            </button>
          </div>

          {activeSection === 'main' && (
            <div className="space-y-8">
            {/* Balances Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#201F1D] rounded-2xl shadow-lg p-6 border-2 border-[#333230]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Balances</h2>
                <button
                  onClick={refreshBalance}
                  disabled={refreshingBalance}
                  className="bg-[#E3A849] hover:bg-[#D4972A] disabled:bg-[#333230] disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {refreshingBalance && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {refreshingBalance ? 'Refreshing All Balances...' : 'Refresh All Balances'}
                </button>
              </div>
              
              {(walletInfo?.lastUpdated || requiredBalance?.lastUpdated) && (
                <div className="mb-4 text-sm text-gray-400">
                  Balances updated: {new Date((walletInfo?.lastUpdated || requiredBalance?.lastUpdated)!).toLocaleString()}
                  {(walletInfo?.responseTime || requiredBalance?.responseTime) && (
                    <span>
                      {` (`}
                      {walletInfo?.responseTime && `Wallet: ${walletInfo.responseTime}`}
                      {walletInfo?.responseTime && requiredBalance?.responseTime && `, `}
                      {requiredBalance?.responseTime && `Required: ${requiredBalance.responseTime}`}
                      {`)`}
                    </span>
                  )}
                  {walletInfo?.blockHeight && ` • Block: ${walletInfo.blockHeight}`}
                  {walletInfo?.syncProgress && walletInfo.syncProgress < 1 && 
                    ` • Sync: ${(walletInfo.syncProgress * 100).toFixed(1)}%`
                  }
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-2 border-[#333230] rounded-lg">
                  <thead>
                    <tr className="border-b-2 border-[#333230]">
                      <th className="text-left py-3 px-4 text-[#E3A849]">Available Balance</th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Pending Balance</th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Required Balance</th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Addresses</th>
                    </tr>
                  </thead>
                  <tbody>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border-b-2 border-[#333230]"
                    >
                      <td className="py-3 px-4 text-white">
                        <div className={`font-mono text-sm transition-all duration-300 ${refreshingBalance ? 'opacity-50 animate-pulse' : ''}`}>
                          {walletInfo ? `Ð ${walletInfo.availableBalance.toFixed(8)}` : 'Loading...'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">
                        <div className={`font-mono text-sm transition-all duration-300 ${refreshingBalance ? 'opacity-50 animate-pulse' : ''}`}>
                          {walletInfo ? `Ð ${walletInfo.pendingBalance.toFixed(8)}` : 'Loading...'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">
                        <div className={`font-mono text-sm transition-all duration-300 ${refreshingBalance ? 'opacity-50 animate-pulse' : ''} ${
                          walletInfo && requiredBalance 
                            ? walletInfo.availableBalance >= requiredBalance.requiredBalance
                              ? 'text-green-400'
                              : 'text-red-400'
                            : ''
                        }`}>
                          {requiredBalance ? `Ð ${requiredBalance.requiredBalance.toFixed(8)}` : 'Loading...'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">
                        <div className="font-mono break-all text-sm">
                          {walletInfo?.addresses && walletInfo.addresses.length > 0 ? (
                            <div className="space-y-1">
                              {walletInfo.addresses.map((address, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleAddressClick(address)}
                                  className="text-blue-400 hover:text-blue-300 underline cursor-pointer block"
                                  title="Click to show QR code"
                                >
                                  {address}
                                </button>
                              ))}
                            </div>
                          ) : (
                            'Loading...'
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  </tbody>
                </table>
              </div>
              
              {walletInfo?.syncProgress && walletInfo.syncProgress < 0.99 && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 text-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m12 2v4m0 12v4m10-10h-4m-12 0h-4"></path>
                    </svg>
                    Dogecoin node is syncing ({(walletInfo.syncProgress * 100).toFixed(1)}% complete). Balance may not reflect recent transactions until sync is complete.
                  </div>
                </div>
              )}
              
              {prizes.filter(p => p.type === 'Random' && p.status !== 'Transferred').length > prizePool.reduce((sum, entry) => sum + entry.quantity, 0) && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-700 text-red-200 rounded-lg">
                  Random Prize Pool is over allocated, add more prizes or remove some redemption codes
                </div>
              )}
            </motion.div>

            {/* Prizes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#201F1D] rounded-2xl shadow-lg p-6 border-2 border-[#333230]"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Prizes</h2>
                
                <div className="flex flex-wrap gap-4 items-end justify-end">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Prize Type
                    </label>
                    <select
                      value={newPrize.type}
                      onChange={e => setNewPrize({ ...newPrize, type: e.target.value })}
                      className="px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#151413] text-white"
                    >
                      <option value="Specific">Specific</option>
                      <option value="Random">Random</option>
                      <option value="Assigned">Assigned</option>
                    </select>
                  </div>
                  {newPrize.type === 'Specific' && (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Amount (DOGE)
                      </label>
                      <input
                        type="number"
                        value={newPrize.amount}
                        onChange={e => setNewPrize({ ...newPrize, amount: e.target.value })}
                        placeholder="0.00"
                        step="0.00000001"
                        min="0"
                        className="px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#151413] text-white"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Redemption Code
                    </label>
                    <input
                      type="text"
                      value={newPrize.redemptionCode}
                      onChange={e => setNewPrize({ ...newPrize, redemptionCode: e.target.value })}
                      placeholder="Enter redemption code"
                      className="px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#151413] text-white"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleCreatePrize}
                      disabled={
                        (newPrize.type === 'Specific' && (!newPrize.amount.trim() || !newPrize.redemptionCode.trim())) ||
                        (newPrize.type === 'Random' && !newPrize.redemptionCode.trim())
                      }
                      className="bg-[#580DA9] text-white px-4 py-2 rounded-lg hover:bg-[#4A0B8F] disabled:bg-[#333230] disabled:cursor-not-allowed"
                    >
                      Create Prize
                    </button>
                  </div>
                  {prizeError && (
                    <div className="text-red-500 text-sm mt-1">{prizeError}</div>
                  )}
                </div>
              </div>



              <div className="overflow-x-auto">
                <table className="min-w-full border-2 border-[#333230] rounded-lg">
                  <thead>
                    <tr className="border-b-2 border-[#333230]">
                      <th className="text-left py-3 px-4 text-[#E3A849]">Redemption Code</th>
                      <th className="text-left py-3 px-4 text-[#E3A849] cursor-pointer hover:text-[#F0B55A]" onClick={() => handlePrizeSort('amount')}>
                        Amount {prizeSortField === 'amount' && (prizeSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-3 px-4 text-[#E3A849] cursor-pointer hover:text-[#F0B55A]" onClick={() => handlePrizeSort('type')}>
                        Type {prizeSortField === 'type' && (prizeSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-3 px-4 text-[#E3A849] cursor-pointer hover:text-[#F0B55A]" onClick={() => handlePrizeSort('status')}>
                        Status {prizeSortField === 'status' && (prizeSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {sortedPrizes.map((prize) => (
                        <motion.tr
                          key={prize.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="border-b-2 border-[#333230]"
                        >
                          <td className="py-3 px-4 text-white">
                            {editingPrize?.id === prize.id ? (
                              <input
                                type="text"
                                value={editingPrize.redemptionCode}
                                onChange={(e) => setEditingPrize({ ...editingPrize, redemptionCode: e.target.value })}
                                className="w-full min-w-[200px] px-2 py-1 rounded border border-[#333230] bg-[#151413] text-white"
                              />
                            ) : (
                              prize.redemptionCode || '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {editingPrize?.id === prize.id ? (
                              <input
                                type="number"
                                value={editingPrize.amount}
                                onChange={(e) => setEditingPrize({ ...editingPrize, amount: e.target.value })}
                                className="w-full px-2 py-1 rounded border border-[#333230] bg-[#151413] text-white"
                              />
                            ) : (
                              prize.type === 'Random' ? '-' : `Ð ${prize.amount}`
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {editingPrize?.id === prize.id ? (
                              <select
                                value={editingPrize.type}
                                onChange={e => setEditingPrize({ ...editingPrize, type: e.target.value })}
                                className="w-full px-2 py-1 rounded border border-[#333230] bg-[#151413] text-white min-w-[120px]"
                              >
                                <option value="Specific">Specific</option>
                                <option value="Random">Random</option>
                                <option value="Assigned">Assigned</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                prize.type === 'Specific'
                                  ? 'bg-green-900/30 text-green-200'
                                  : prize.type === 'Random'
                                  ? 'bg-purple-900/30 text-purple-200'
                                  : 'bg-orange-900/30 text-orange-200'
                              }`}>
                                {prize.type}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingPrize?.id === prize.id ? (
                              <select
                                value={editingPrize.status}
                                onChange={(e) => setEditingPrize({ ...editingPrize, status: e.target.value })}
                                className="w-full px-2 py-1 rounded border border-[#333230] bg-[#151413] text-white min-w-[120px]"
                              >
                                <option value="Available">Available</option>
                                <option value="Redeemed">Redeemed</option>
                                <option value="Transferred">Transferred</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                prize.status === 'Available'
                                  ? 'bg-green-900/30 text-green-200'
                                  : prize.status === 'Transferred'
                                  ? 'bg-yellow-900/30 text-yellow-200'
                                  : 'bg-red-900/30 text-red-200'
                              }`}>
                                {prize.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {editingPrize?.id === prize.id ? (
                                <>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-3 py-1 bg-[#580DA9] text-white rounded-lg hover:bg-[#4A0B8F]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 bg-[#333230] text-white rounded-lg hover:bg-[#2A2A2A]"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditPrize(prize)}
                                    className="px-3 py-1 bg-[#580DA9] text-white rounded-lg hover:bg-[#4A0B8F]"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemovePrize(prize.id)}
                                    className="px-3 py-1 bg-red-900/30 text-red-200 rounded-lg hover:bg-red-800/30"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* CSV Import Section - Bottom Right */}
              <div className="mt-4 flex justify-end">
                <div className="bg-[#151413] rounded-lg p-4 border-2 border-[#333230] max-w-md">
                  <h4 className="text-sm font-semibold text-white mb-3">Import CSV</h4>
                  <div className="space-y-3">
                    <div>
                      <input
                        id="csvFileInput"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="w-full px-2 py-1 text-xs rounded border border-[#333230] bg-[#201F1D] text-white cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#580DA9] file:text-white hover:file:bg-[#4A0B8F] file:cursor-pointer"
                      />
                    </div>
                    <div>
                      <button
                        onClick={handleCsvImport}
                        disabled={!csvFile || csvImporting}
                        className="w-full text-xs bg-[#E3A849] text-black px-3 py-2 rounded hover:bg-[#D4981E] disabled:bg-[#333230] disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        {csvImporting ? 'Importing...' : 'Import CSV'}
                      </button>
                    </div>
                    {csvError && (
                      <div className="text-red-500 text-xs whitespace-pre-line">{csvError}</div>
                    )}
                    <div className="text-gray-400 text-xs">
                      <p>Format: Code,Type,Amount</p>
                      <p>Types: Random, Specific, Assigned</p>
                      <p>Random type prizes = 0 DOGE</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Random Prize Pool Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#201F1D] rounded-2xl shadow-lg p-6 border-2 border-[#333230]"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Random Prize Pool</h2>
                <div className="flex flex-wrap gap-4 items-end justify-end">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Amount (DOGE)
                    </label>
                    <input
                      type="number"
                      value={newPoolEntry.amount}
                      onChange={e => setNewPoolEntry({ ...newPoolEntry, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.00000001"
                      min="0"
                      className="px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#151413] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newPoolEntry.quantity}
                      onChange={e => setNewPoolEntry({ ...newPoolEntry, quantity: e.target.value })}
                      placeholder="1"
                      min="1"
                      className="px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#151413] text-white"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleAddPoolEntry}
                      disabled={!newPoolEntry.amount.trim() || !newPoolEntry.quantity.trim()}
                      className="bg-[#580DA9] text-white px-4 py-2 rounded-lg hover:bg-[#4A0B8F] disabled:bg-[#333230] disabled:cursor-not-allowed"
                    >
                      Add Pool Entry
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-2 border-[#333230] rounded-lg">
                  <thead>
                    <tr className="border-b-2 border-[#333230]">
                      <th className="text-left py-3 px-4 text-[#E3A849] cursor-pointer hover:text-[#F0B55A]" onClick={() => handlePoolSort('amount')}>
                        Amount {poolSortField === 'amount' && (poolSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-3 px-4 text-[#E3A849] cursor-pointer hover:text-[#F0B55A]" onClick={() => handlePoolSort('quantity')}>
                        Quantity {poolSortField === 'quantity' && (poolSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Created</th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {sortedPrizePool.map((entry) => (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="border-b-2 border-[#333230]"
                        >
                          <td className="py-3 px-4 text-white">
                            {editingPoolEntry?.id === entry.id ? (
                              <input
                                type="number"
                                value={editingPoolEntry.amount}
                                onChange={(e) => setEditingPoolEntry({ ...editingPoolEntry, amount: parseFloat(e.target.value) })}
                                className="w-full px-2 py-1 rounded border border-[#333230] bg-[#151413] text-white"
                              />
                            ) : (
                              `Ð ${entry.amount}`
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {editingPoolEntry?.id === entry.id ? (
                              <input
                                type="number"
                                value={editingPoolEntry.quantity}
                                onChange={(e) => setEditingPoolEntry({ ...editingPoolEntry, quantity: parseInt(e.target.value) })}
                                className="w-full px-2 py-1 rounded border border-[#333230] bg-[#151413] text-white"
                              />
                            ) : (
                              entry.quantity
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {editingPoolEntry?.id === entry.id ? (
                                <>
                                  <button
                                    onClick={handleSaveEditPoolEntry}
                                    className="px-3 py-1 bg-[#580DA9] text-white rounded-lg hover:bg-[#4A0B8F]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditPoolEntry}
                                    className="px-3 py-1 bg-[#333230] text-white rounded-lg hover:bg-[#2A2A2A]"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditPoolEntry(entry)}
                                    className="px-3 py-1 bg-[#580DA9] text-white rounded-lg hover:bg-[#4A0B8F]"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemovePoolEntry(entry.id)}
                                    className="px-3 py-1 bg-red-900/30 text-red-200 rounded-lg hover:bg-red-800/30"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {poolError && (
                <div className="mt-4 text-red-500 text-sm">{poolError}</div>
              )}
            </motion.div>
            </div>
          )}

          {activeSection === 'config' && (
            <ServerConfig />
          )}

          {activeSection === 'logs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#201F1D] rounded-2xl shadow-lg p-6 border-2 border-[#333230]"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Audit Logs</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border-2 border-[#333230] rounded-lg">
                  <thead>
                    <tr className="border-b-2 border-[#333230]">
                      <th className="text-left py-3 px-4 text-[#E3A849]">Time</th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Action</th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Entity</th>
                      <th className="text-left py-3 px-4 text-[#E3A849]">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {auditLogs.map((log) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="border-b-2 border-[#333230]"
                        >
                          <td className="py-3 px-4 text-[#E3A849]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              log.action === 'CREATE' 
                                ? 'bg-green-900/30 text-green-200'
                                : log.action === 'UPDATE'
                                ? 'bg-blue-900/30 text-blue-200'
                                : 'bg-purple-900/30 text-purple-200'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">
                            {log.entityType} #{log.entityId}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {log.details}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeQrModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#201F1D] rounded-2xl p-6 border-2 border-[#333230] max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Wallet QR Code
                </h3>
                <button
                  onClick={closeQrModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-white text-sm mb-2">Address:</p>
                  <p className="font-mono text-xs text-gray-300 break-all">
                    {qrModal.address}
                  </p>
                  <a
                    href={`https://sochain.com/address/DOGE/${qrModal.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline mt-1 inline-block"
                  >
                    View on SoChain
                  </a>
                </div>
                
                <div className="mb-4">
                  <p className="text-white text-sm mb-2">Amount: Ð {qrModal.amount}</p>
                </div>

                {/* Dogecoin QR Code */}
                <div className="flex justify-center">
                  <div className="relative">
                    {customElements.get('doge-qr') ? (
                      <doge-qr
                        address={qrModal.address}
                        amount={qrModal.amount}
                        theme="such-doge"
                      ></doge-qr>
                    ) : (
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-black text-sm font-bold mb-2">QR Code Loading...</p>
                        <p className="text-gray-600 text-xs">Please wait for the QR code to appear</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-400 text-xs">
                    Scan to send Ð {qrModal.amount} to this wallet
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address QR Code Modal */}
      <AnimatePresence>
        {addressModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeAddressModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#201F1D] rounded-2xl p-6 border-2 border-[#333230] max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Wallet Address QR Code
                </h3>
                <button
                  onClick={closeAddressModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-white text-sm mb-2">Address:</p>
                  <p className="font-mono text-xs text-gray-300 break-all">
                    {addressModal.address}
                  </p>
                  <a
                    href={`https://sochain.com/address/DOGE/${addressModal.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline mt-1 inline-block"
                  >
                    View on SoChain
                  </a>
                </div>

                {/* Dogecoin QR Code */}
                <div className="flex justify-center">
                  <div className="relative">
                    {customElements.get('doge-qr') ? (
                      <doge-qr
                        address={addressModal.address}
                        amount={0}
                        theme="such-doge"
                      ></doge-qr>
                    ) : (
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-black text-sm font-bold mb-2">QR Code Loading...</p>
                        <p className="text-gray-600 text-xs">Please wait for the QR code to appear</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-400 text-xs">
                    Scan to view this wallet address
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DbWarning>
  );
}