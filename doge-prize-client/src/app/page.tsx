"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { hello, redeemCode, submitTransaction, Prize } from "../backend";
import { isValidDogecoinAddress } from "@/utils/dogecoin";
import styles from './styles/card.module.css';
import Wave from './components/Wave';
import LottieAnimation from './components/LottieAnimation';
import presentAnimationData from '../../public/present-open.json';
import { useConfig } from '../config/useConfig';
import { configManager } from '../config';
import { getServerUrl } from '../constants';

const Confetti = dynamic(() => import('react-confetti'), {
  ssr: false
});

export default function Home() {
  const { config, loading: configLoading } = useConfig();
  const [code, setCode] = useState("");
  const [showPrize, setShowPrize] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [addressValid, setAddressValid] = useState(false);
  const [serverIp, setServerIp] = useState("");
  const [serverValid, setServerValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setSuccess] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [isClient, setIsClient] = useState(false);
  const [, setRedeemStatus] = useState<string | null>(null);
  const [, setRedeemMessage] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const walletInputRef = useRef<HTMLInputElement>(null);
  const serverIpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showOptions && walletInputRef.current) {
      walletInputRef.current.focus();
    }
  }, [showOptions]);

  useEffect(() => {
    if (serverIpInputRef.current) {
      serverIpInputRef.current.focus();
    }
  }, []);

  const validateServer = useCallback(async (ip: string) => {
    if (!ip.trim()) {
      setServerValid(false);
      setIsValidating(false);
      return;
    }

    try {
      const result = await hello(ip);
      setServerValid(result.valid);
      
      // Handle server configuration
      if (result.valid && result.hasCustomConfig && result.config) {
        // Construct the proper server URL for image loading
        const serverUrl = getServerUrl(ip);
        // Set server config to override default config
        configManager.setServerConfig(result.config, serverUrl);
      } else {
        // Clear server config to use default config
        configManager.clearServerConfig();
      }
    } catch (error) {
      setServerValid(false);
      configManager.clearServerConfig();
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleServerIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIp = e.target.value;
    setServerIp(newIp);
    setError(null);
    setServerValid(null);
    
    // Clear server config if the input is empty
    if (!newIp.trim()) {
      configManager.clearServerConfig();
      // Preserve focus on the input after clearing config
      setTimeout(() => {
        if (serverIpInputRef.current) {
          serverIpInputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleServerIpBlur = () => {
    if (serverIp.trim()) {
      setIsValidating(true);
      validateServer(serverIp);
    }
  };

  useEffect(() => {
    if (!serverIp.trim()) {
      setServerValid(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(() => {
      validateServer(serverIp);
    }, 500);

    return () => clearTimeout(timer);
  }, [serverIp, validateServer]);

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);
    setAddressValid(isValidDogecoinAddress(address));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const result = await redeemCode(serverIp, code);
      
      if (!result.valid) {
        setError(result.error || result.message || 'Invalid code');
        return;
      }

      if (result.prize) {
        setPrize(result.prize);
        setSuccess(`Congratulations! You won Ð ${result.prize.amount}!`);
        setShowPrize(true);
        setShowConfetti(true);
        setCode('');
      } else {
        setError('No prize found for this code');
      }
    } catch (err) {
      setError('Failed to redeem code. Please try again.');
    }
  };

  const handleQuickRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setTransactionError(null);
    setRedeemStatus(null);
    setRedeemMessage(null);
    
    if (!prize?.redemptionCode || !walletAddress) {
      setRedeemStatus('error');
      setRedeemMessage('Both redemption code and wallet address are required');
      return;
    }

    if (prize.status === 'Transferred') {
      setRedeemStatus('error');
      setRedeemMessage('This prize has been transferred');
      return;
    }

    try {
      const result = await submitTransaction(serverIp, prize.redemptionCode, walletAddress);
      if (result.success) {
        setRedeemStatus('success');
        // Use the actual transaction hash from the server response
        const transactionHash = result.transactionHash;
        if (transactionHash) {
          setSuccessMessage(`Transaction submitted successfully! Hash: ${transactionHash}`);
        } else {
          setSuccessMessage('Transaction submitted successfully!');
        }
        setShowSuccessPopup(true);
        setPrize(prev => prev ? { ...prev, status: 'Transferred' } : null);
        setWalletAddress('');
      } else {
        setRedeemStatus('error');
        setTransactionError(result.message || 'Error submitting transaction');
      }
    } catch (error) {
      setRedeemStatus('error');
      setTransactionError('Error submitting transaction');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showPrize && serverValid) {
      e.preventDefault();
      const form = e.currentTarget.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleRedeemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowOptions(true);
    }
  };

  const getPanelAlignmentClass = (alignment: string | undefined) => {
    switch (alignment) {
      case 'left':
        return styles.panelLeft;
      case 'right':
        return styles.panelRight;
      case 'center':
      default:
        return styles.panelCenter;
    }
  };

  const getCardAlignmentClass = (alignment: string | undefined) => {
    switch (alignment) {
      case 'left':
        return styles.cardLeft;
      case 'right':
        return styles.cardRight;
      case 'center':
      default:
        return styles.cardCenter;
    }
  };

  // Show loading state while config is loading
  if (configLoading) {
    return (
      <div className="min-h-screen bg-[#151413] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-[#151413] ${getPanelAlignmentClass(config?.panelAlignment)}`}
      onKeyDown={handleKeyDown}
      style={{
        backgroundImage: config?.backgroundImage ? `url(${config.backgroundImage})` : 'url(/background.png)'
      }}
    >
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          colors={['#BF973A', '#CEAC5E', '#A48132', '#D9BF83', '#F1E7D1', '#775D24']}
          onConfettiComplete={() => setShowConfetti(false)}
          style={{ position: 'fixed', zIndex: 9999 }}
        />
      )}
      <div className={`${getCardAlignmentClass(config?.panelAlignment)} ${styles.cardHeight} ${showPrize && !showOptions ? styles.congratulationsScreen : ''}`}>
        <AnimatePresence mode="wait">
          <div className={styles.contentPanel}>
            {!showPrize ? (
              <>
                <motion.div
                  key="closed"
                  initial={{ opacity: 1 }}
                  animate={{ 
                    opacity: 1,
                    rotate: [0, 10, -10, 10, -10, 0],
                  }}
                  exit={{ opacity: 1 }}
                  className={styles.presentContainer}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                    times: [0, 0.1, 0.3, 0.7, 0.9, 1],
                  }}
                >
                  <Image
                    src="/present-closed.svg"
                    alt="Closed present"
                    width={160}
                    height={160}
                    priority
                    loading="eager"
                    className={styles.presentImage}
                  />
                </motion.div>
                
                <div className="flex flex-col items-center gap-8">
                  <div className="flex flex-col items-center">
                    <h1 className={styles.title}>
                      {config?.title || "Doge Prize"}
                    </h1>
                    <div className="flex justify-center items-center gap-[10px] w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="21" height="18" viewBox="0 0 21 18" fill="none">
                        <path d="M7.05432 0.000145978C7.09644 0.000647974 7.13964 0.00257739 7.18256 0.00572069C8.89196 0.28149 9.83186 1.97089 9.96805 3.46065C10.1671 4.81247 9.52967 6.54995 7.94156 6.85286C7.71121 6.89385 7.47185 6.87512 7.24668 6.81802C5.33432 6.2187 4.47852 4.10188 4.75495 2.34849C4.8353 1.21605 5.74869 -0.0154159 7.05432 0.000145978ZM14.3014 0.0726172C15.3643 0.0970024 16.1922 1.10454 16.3607 2.05164C16.7157 3.92806 15.8025 6.25951 13.7109 6.85286C13.515 6.89268 13.3123 6.89678 13.1144 6.86819C11.7007 6.64799 11.1018 5.16662 11.161 3.97073C11.2035 2.3932 12.0803 0.569128 13.8331 0.125577C13.9934 0.0858666 14.1495 0.0691336 14.3014 0.0726172ZM2.42277 5.40204C4.26152 5.50486 5.52213 7.21956 5.70184 8.82073C5.94518 9.97553 5.28646 11.5201 3.87665 11.6123C1.91086 11.5896 0.569803 9.6264 0.514084 7.93714C0.389742 6.81991 1.09389 5.46373 2.42277 5.40204ZM18.5169 5.78251C19.2992 5.77622 20.0685 6.21417 20.3242 6.95738C21.0062 8.9455 19.6366 11.4635 17.3836 11.8812C16.4433 12.0316 15.6171 11.3567 15.384 10.5447C14.8899 8.80786 15.9047 6.79114 17.6222 6.00272C17.902 5.85595 18.2108 5.78498 18.5169 5.78251ZM10.2737 9.34754C11.8073 9.3506 13.365 0.078 14.358 11.1607C15.4306 12.4227 16.3092 13.8913 16.6529 15.4839C17.0705 16.6304 16.1241 17.9497 14.8128 17.9577C13.2354 17.9986 11.8796 16.9862 10.311 16.911C8.98018 16.7214 7.78854 17.3684 6.59206 17.7918C5.57333 18.1991 4.16563 18.043 3.64552 17.0183C3.23642 15.9739 3.83858 14.8603 4.33742 13.9327C5.35486 12.4273 6.44486 10.845 8.11305 9.90501C8.7817 9.51765 9.52477 9.34605 10.2737 9.34754Z" fill="#E3A849"/>
                      </svg>
                      <span className={styles.subtitle}>
                        {config?.subtitle || "Dogecoin Prizes for everyone"}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="21" height="18" viewBox="0 0 21 18" fill="none">
                        <path d="M7.05432 0.000145978C7.09644 0.000647974 7.13964 0.00257739 7.18256 0.00572069C8.89196 0.28149 9.83186 1.97089 9.96805 3.46065C10.1671 4.81247 9.52967 6.54995 7.94156 6.85286C7.71121 6.89385 7.47185 6.87512 7.24668 6.81802C5.33432 6.2187 4.47852 4.10188 4.75495 2.34849C4.8353 1.21605 5.74869 -0.0154159 7.05432 0.000145978ZM14.3014 0.0726172C15.3643 0.0970024 16.1922 1.10454 16.3607 2.05164C16.7157 3.92806 15.8025 6.25951 13.7109 6.85286C13.515 6.89268 13.3123 6.89678 13.1144 6.86819C11.7007 6.64799 11.1018 5.16662 11.161 3.97073C11.2035 2.3932 12.0803 0.569128 13.8331 0.125577C13.9934 0.0858666 14.1495 0.0691336 14.3014 0.0726172ZM2.42277 5.40204C4.26152 5.50486 5.52213 7.21956 5.70184 8.82073C5.94518 9.97553 5.28646 11.5201 3.87665 11.6123C1.91086 11.5896 0.569803 9.6264 0.514084 7.93714C0.389742 6.81991 1.09389 5.46373 2.42277 5.40204ZM18.5169 5.78251C19.2992 5.77622 20.0685 6.21417 20.3242 6.95738C21.0062 8.9455 19.6366 11.4635 17.3836 11.8812C16.4433 12.0316 15.6171 11.3567 15.384 10.5447C14.8899 8.80786 15.9047 6.79114 17.6222 6.00272C17.902 5.85595 18.2108 5.78498 18.5169 5.78251ZM10.2737 9.34754C11.8073 9.3506 13.365 0.078 14.358 11.1607C15.4306 12.4227 16.3092 13.8913 16.6529 15.4839C17.0705 16.6304 16.1241 17.9497 14.8128 17.9577C13.2354 17.9986 11.8796 16.9862 10.311 16.911C8.98018 16.7214 7.78854 17.3684 6.59206 17.7918C5.57333 18.1991 4.16563 18.043 3.64552 17.0183C3.23642 15.9739 3.83858 14.8603 4.33742 13.9327C5.35486 12.4273 6.44486 10.845 8.11305 9.90501C8.7817 9.51765 9.52477 9.34605 10.2737 9.34754Z" fill="#E3A849"/>
                      </svg>
                    </div>
                  </div>
                  <p className={styles.description}>
                    {config?.prizeHeading || "Enter your code below to reveal your PRIZE!!!"}
                  </p>
                </div>

                <motion.form
                  key="code-form"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="w-full flex flex-col gap-4"
                >
                  <div className="w-full">
                    <div className={styles.inputTitle}>{config?.serverHeading || "Server address"}</div>
                    <div className="relative w-full">
                      <input
                        ref={serverIpInputRef}
                        type="text"
                        value={serverIp}
                        onChange={handleServerIpChange}
                        onBlur={handleServerIpBlur}
                        placeholder={config?.serverPlaceholder || "Enter server IP address"}
                        className={`${styles.inputField} ${
                          serverIp && !isValidating
                            ? serverValid
                              ? styles.validInput
                              : styles.invalidInput
                            : ''
                        }`}
                      />
                    </div>
                  </div>
                  {serverIp && !isValidating && serverValid === false && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                    >
                      Unable to connect to server. Please check the IP address and try again.
                    </motion.div>
                  )}
                  <div className="w-full">
                    <div className={styles.inputTitle}>{config?.redemptionCodeHeading || "Redemption code"}</div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={config?.redemptionCodePlaceholder || "Enter redemption code"}
                      className={styles.inputField}
                    />
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                    >
                      {error}
                    </motion.div>
                  )}
                  <button
                    type="submit"
                    disabled={!serverValid || !code.trim()}
                    className={styles.lookInsideButton}
                    title={!serverValid ? 'Enter a valid server' : !code.trim() ? 'Enter a redemption code' : ''}
                  >
                    {config?.redeemButtonText || "Look inside"}
                  </button>
                </motion.form>
              </>
            ) : (
              <>
                <motion.div
                  key="open"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.presentContainer}
                >
                  {showOptions ? (
                    <div className={styles.starsContainer}>
                      <Image
                        src="/stars.svg"
                        alt="Stars background"
                        width={160}
                        height={160}
                        className={styles.starsBackground}
                        priority
                      />
                      <Image
                        src="/coins.svg"
                        alt="Coins"
                        width={160}
                        height={160}
                        className={styles.coinsImage}
                        priority
                      />
                    </div>
                  ) : (
                    <div className={styles.prizeAnimationContainer}>
                      <LottieAnimation
                        animationData={presentAnimationData}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  )}
                </motion.div>
                <motion.div
                  key="prize-content"
                  initial={{ opacity: 1 }}
                  className="w-full flex flex-col items-center gap-8"
                >
                  {showOptions ? (
                    <>
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        className={styles.prizeAmount}
                      >
                        <span className={styles.prizeSymbol}>Ð</span> {prize?.amount}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        className={styles.congratulations}
                      >
                        Transfer to your wallet
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        className={styles.transferDescription}
                      >
                        Enter your wallet address below.
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        className={styles.congratulations}
                      >
                        Congratulations you won
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        className={styles.prizeAmount}
                      >
                        <span className={styles.prizeSymbol}>Ð</span> {prize?.amount}
                      </motion.div>
                    </>
                  )}

                  {!showOptions ? (
                    <button
                      onClick={prize?.status === 'Transferred' ? undefined : () => setShowOptions(true)}
                      onKeyDown={prize?.status === 'Transferred' ? undefined : handleRedeemKeyDown}
                      disabled={prize?.status === 'Transferred'}
                      className={`${styles.lookInsideButton} ${
                        prize?.status === 'Transferred' 
                          ? 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      {prize?.status === 'Transferred' ? 'This prize has been transferred' : 'Redeem Prize'}
                    </button>
                  ) : (
                    <div
                      className="w-full flex flex-col gap-8"
                    >
                      <div className="flex flex-col gap-8">
                        <div>
                          {prize?.status === 'Transferred' ? (
                            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-center">
                              This prize has been transferred
                            </div>
                          ) : (
                            <form onSubmit={handleQuickRedeem} className="flex flex-col gap-8">
                              <input
                                ref={walletInputRef}
                                type="text"
                                value={walletAddress}
                                onChange={handleWalletAddressChange}
                                placeholder="Enter your Dogecoin address"
                                className={`${styles.inputField} ${
                                  walletAddress ? (addressValid ? styles.validInput : styles.invalidInput) : ''
                                }`}
                              />
                              {walletAddress && !addressValid && (
                                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                  Invalid Dogecoin address
                                </div>
                              )}
                              {transactionError && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                >
                                  {transactionError}
                                </motion.div>
                              )}
                              <button
                                type="submit"
                                disabled={!addressValid}
                                className={`${styles.lookInsideButton} ${!addressValid ? styles.disabledButton : ''}`}
                              >
                                Transfer Now
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}
            <a 
              href={config?.footerUrl || "https://dogecoin.com"}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerContainer}
              style={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              {config?.footerTextPosition === "above" && (
                <div className={styles.footerText}>{config?.footerText || ""}</div>
              )}
              {config?.footerImage && (
                <img
                  src={config.footerImage}
                  alt="Footer logo"
                  style={{ 
                    maxHeight: 50, 
                    maxWidth: 100,
                    objectFit: 'contain',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              )}
              {config?.footerTextPosition !== "above" && (
                <div className={styles.footerText}>{config?.footerText || "Do Only Good Everyday"}</div>
              )}
            </a>
            <a 
              href={config?.footerUrl || "https://dogecoin.com"}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerContainerDesktop}
              style={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              {config?.footerTextPosition === "above" && (
                <div className={styles.footerText}>{config?.footerText || ""}</div>
              )}
              {config?.footerImage && (
                <img
                  src={config.footerImage}
                  alt="Footer logo"
                  style={{ 
                    maxHeight: 50, 
                    maxWidth: 100,
                    objectFit: 'contain',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              )}
              {config?.footerTextPosition !== "above" && (
                <div className={styles.footerText}>{config?.footerText || "Do Only Good Everyday"}</div>
              )}
            </a>
          </div>
        </AnimatePresence>
      </div>
      {config?.logoImage && (
        <img
          src={config.logoImage}
          alt="Logo"
          className={styles.logo}
          style={{
            width: '701.726px',
            height: '703px',
            flexShrink: 0,
            aspectRatio: '701.73/703.00'
          }}
        />
      )}
      {isClient && config?.showWave && <Wave />}
      {showSuccessPopup && (
        <div className={styles.successPopup}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={styles.successPopupContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSuccessPopup(false)}
              className={styles.closeButton}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M5.48816 5.48816C6.13903 4.83728 7.19431 4.83728 7.84518 5.48816L20 17.643L32.1548 5.48816C32.8057 4.83729 33.861 4.83729 34.5118 5.48816C35.1627 6.13904 35.1627 7.19431 34.5118 7.84518L22.357 20L34.5118 32.1548C35.1627 32.8057 35.1627 33.861 34.5118 34.5118C33.861 35.1627 32.8057 35.1627 32.1548 34.5118L20 22.357L7.84518 34.5118C7.1943 35.1627 6.13903 35.1627 5.48816 34.5118C4.83728 33.861 4.83728 32.8057 5.48816 32.1548L17.643 20L5.48816 7.84518C4.83728 7.1943 4.83728 6.13903 5.48816 5.48816Z" fill="white"/>
              </svg>
            </button>
            <div className="w-24 h-24 relative">
              <Image
                src="/stars.svg"
                alt="Stars background"
                width={100}
                height={100}
                style={{ 
                  width: 'auto', 
                  height: 'auto',
                  position: 'absolute',
                  zIndex: 1
                }}
                priority
              />
              <Image
                src="/coins.svg"
                alt="Coins"
                width={100}
                height={100}
                style={{ 
                  width: 'auto', 
                  height: 'auto',
                  position: 'relative',
                  zIndex: 2
                }}
                priority
              />
            </div>
            <div className="text-center flex flex-col gap-6">
              <h2 className="text-[#FFF] text-center text-[40px] font-bold leading-[48px]">
                Transaction Submitted
              </h2>
              <p className="text-[#FFF] text-center text-[20px] font-normal leading-[28px]">
                We've submitted a transaction to the Dogecoin network that will send the prize to your wallet
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-[#FFF] text-center text-[20px] font-bold leading-[32px]">
                  See your transaction's progress here:
                </p>
                <a 
                  href={`https://sochain.com/tx/DOGE/${successMessage?.split('Hash: ')[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E3A849] underline break-all"
                >
                  https://sochain.com/tx/DOGE/{successMessage?.split('Hash: ')[1]}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}