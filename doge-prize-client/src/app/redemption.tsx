"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { redeemCode } from '@/backend';
import { isValidDogecoinAddress } from '@/utils/dogecoin';

export default function RedemptionPage() {
  const [serverCode, setServerCode] = useState('');
  const [redemptionCode, setRedemptionCode] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [addressValid, setAddressValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);
    setAddressValid(isValidDogecoinAddress(address));
    setError(null);
  };

  const handleRedeem = async () => {
    if (!serverCode.trim() || !redemptionCode.trim() || !walletAddress.trim()) {
      setError('Please enter all required fields');
      return;
    }

    if (!addressValid) {
      setError('Please enter a valid Dogecoin address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await redeemCode(serverCode, redemptionCode);
      
      if (!response.valid) {
        setError(response.error || 'Invalid redemption code');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to redeem code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <motion.div
          className="flex justify-center mb-8"
          animate={{
            rotate: [0, 10, -10, 10, -10, 0],
            scale: [1, 1.1, 1, 1.1, 1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            className="w-24 h-24 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z"
              clipRule="evenodd"
            />
            <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
          </svg>
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Doge Prize Redemption
        </h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="serverCode" className="block text-sm font-medium text-gray-700 mb-1">
              Server Code
            </label>
            <input
              id="serverCode"
              type="text"
              value={serverCode}
              onChange={(e) => setServerCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter server code"
            />
          </div>

          <div>
            <label htmlFor="redemptionCode" className="block text-sm font-medium text-gray-700 mb-1">
              Redemption Code
            </label>
            <input
              id="redemptionCode"
              type="text"
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter redemption code"
            />
          </div>

          <div>
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Dogecoin Address
            </label>
            <input
              id="walletAddress"
              type="text"
              value={walletAddress}
              onChange={handleWalletAddressChange}
              className={`w-full p-2 border ${
                walletAddress ? (addressValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
              } rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter your Dogecoin address"
            />
            {walletAddress && !addressValid && (
              <div className="text-red-500 text-sm mt-1">
                Invalid Dogecoin address
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {success && (
            <div className="text-green-500 text-sm text-center">
              Congratulations! Your prize has been redeemed successfully!
            </div>
          )}

          <button
            onClick={handleRedeem}
            disabled={loading || !serverCode.trim() || !redemptionCode.trim() || !addressValid}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redeeming...' : 'Redeem Prize'}
          </button>
        </div>
      </div>
    </div>
  );
} 