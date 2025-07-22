"use client";

import { useState, useEffect } from 'react';
import { InputGroup } from './InputGroup';
import { Button } from './Button';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

interface ServerConfigData {
  title: string;
  subtitle: string;
  prizeHeading: string;
  redeemButtonText: string;
  footerText: string;
  footerTextPosition: 'above' | 'below';
  footerImage: string;
  footerUrl: string;
  backgroundImage: string;
  logoImage: string;
  showWave: boolean;
  panelAlignment: 'left' | 'center' | 'right';
}

interface ServerConfigProps {
  onConfigUpdate?: () => void;
}

export function ServerConfig({ onConfigUpdate }: ServerConfigProps) {
  const [config, setConfig] = useState<ServerConfigData>({
    title: '',
    subtitle: '',
    prizeHeading: '',
    redeemButtonText: '',
    footerText: '',
    footerTextPosition: 'below',
    footerImage: '',
    footerUrl: '',
    backgroundImage: '',
    logoImage: '',
    showWave: false,
    panelAlignment: 'left',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      console.log('Loading config from server...');
      const response = await fetch('/api/server-config');
      if (response.ok) {
        const data = await response.json();
        console.log('Load response from server:', data);
        if (data.hasConfig && data.config) {
          // Ensure all string fields are never null/undefined
          const processedConfig = {
            title: data.config.title || '',
            subtitle: data.config.subtitle || '',
            prizeHeading: data.config.prizeHeading || '',
            redeemButtonText: data.config.redeemButtonText || '',
            footerText: data.config.footerText || '',
            footerTextPosition: data.config.footerTextPosition || 'below',
            footerImage: data.config.footerImage || '',
            footerUrl: data.config.footerUrl || '',
            backgroundImage: data.config.backgroundImage || '',
            logoImage: data.config.logoImage || '',
            showWave: data.config.showWave || false,
            panelAlignment: data.config.panelAlignment || 'left',
          };
          console.log('Processed config for UI:', processedConfig);
          setConfig(processedConfig);
        } else {
          console.log('No config found on server');
        }
      } else {
        console.log('Failed to load config, status:', response.status);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    console.log('Saving config from UI:', config);

    try {
      const response = await fetch('/api/server-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save response from server:', result);
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        onConfigUpdate?.();
      } else {
        const error = await response.json();
        console.log('Save error from server:', error);
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/server-config', {
        method: 'DELETE',
      });

      if (response.ok) {
        setConfig({
          title: '',
          subtitle: '',
          prizeHeading: '',
          redeemButtonText: '',
          footerText: '',
          footerTextPosition: 'below',
          footerImage: '',
          footerUrl: '',
          backgroundImage: '',
          logoImage: '',
          showWave: false,
          panelAlignment: 'left',
        });
        setMessage({ type: 'success', text: 'Configuration cleared successfully!' });
        onConfigUpdate?.();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to clear configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, imageType: string) => {
    setUploading(imageType);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', imageType);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const updatedConfig = {
          ...config,
          [imageType === 'background' ? 'backgroundImage' : 
           imageType === 'footer' ? 'footerImage' : 'logoImage']: data.imageUrl
        };
        
        setConfig(updatedConfig);
        
        // Auto-save the config after successful image upload
        const saveResponse = await fetch('/api/server-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedConfig),
        });

        if (saveResponse.ok) {
          setMessage({ type: 'success', text: `${imageType} image uploaded and saved successfully!` });
          onConfigUpdate?.();
        } else {
          setMessage({ type: 'error', text: 'Image uploaded but failed to save configuration' });
        }
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to upload image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, imageType: string) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file, imageType);
    }
  };

  const handleChangePassword = async () => {
    setPasswordLoading(true);
    setPasswordMessage(null);

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All password fields are required' });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match' });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        setPasswordMessage({ type: 'error', text: error.error || 'Failed to change password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold text-white mb-4 ${montserrat.className}`}>
          Server Configuration
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={handleClear}
            disabled={loading}
            className="bg-[#333230] text-white px-4 py-2 rounded-lg hover:bg-[#2A2A2A] disabled:bg-[#333230] disabled:cursor-not-allowed"
          >
            Clear All
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#580DA9] text-white px-4 py-2 rounded-lg hover:bg-[#4A0B8F] disabled:bg-[#333230] disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Basic Settings</h3>
          
          <InputGroup
            label="Title"
            value={config.title}
            onChange={(value) => setConfig(prev => ({ ...prev, title: value }))}
            placeholder="Enter title"
          />

          <InputGroup
            label="Subtitle"
            value={config.subtitle}
            onChange={(value) => setConfig(prev => ({ ...prev, subtitle: value }))}
            placeholder="Enter subtitle"
          />
        </div>

        {/* UI Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">UI Settings</h3>
          
          <InputGroup
            label="Prize Heading"
            value={config.prizeHeading}
            onChange={(value) => setConfig(prev => ({ ...prev, prizeHeading: value }))}
            placeholder="Enter prize heading"
          />

          <InputGroup
            label="Redeem Button Text"
            value={config.redeemButtonText}
            onChange={(value) => setConfig(prev => ({ ...prev, redeemButtonText: value }))}
            placeholder="Enter redeem button text"
          />
        </div>

        {/* Footer Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Footer Settings</h3>
          
          <InputGroup
            label="Footer Text"
            value={config.footerText}
            onChange={(value) => setConfig(prev => ({ ...prev, footerText: value }))}
            placeholder="Enter footer text"
          />

          <InputGroup
            label="Footer URL"
            value={config.footerUrl}
            onChange={(value) => setConfig(prev => ({ ...prev, footerUrl: value }))}
            placeholder="Enter footer URL"
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">
              Footer Text Position
            </label>
            <select
              value={config.footerTextPosition}
              onChange={(e) => setConfig(prev => ({ ...prev, footerTextPosition: e.target.value as 'above' | 'below' }))}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
        </div>

        {/* Layout Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Layout Settings</h3>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">
              Panel Alignment
            </label>
            <select
              value={config.panelAlignment}
              onChange={(e) => setConfig(prev => ({ ...prev, panelAlignment: e.target.value as 'left' | 'center' | 'right' }))}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showWave"
              checked={config.showWave}
              onChange={(e) => setConfig(prev => ({ ...prev, showWave: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showWave" className="text-sm font-medium text-white">
              Show Wave Graphic
            </label>
          </div>
        </div>
      </div>

      {/* Image Uploads */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Images</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Background Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Background Image</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'background')}
                className="hidden"
                id="background-upload"
              />
              <label
                htmlFor="background-upload"
                className="block w-full px-4 py-2 text-center border-2 border-dashed border-gray-300 
                         rounded-lg cursor-pointer hover:border-blue-500 transition-colors text-white"
              >
                {uploading === 'background' ? 'Uploading...' : 'Upload Background'}
              </label>
            </div>
            {config.backgroundImage && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-green-600">✓ Background image uploaded</div>
                  <button
                    onClick={async () => {
                      const updatedConfig = { ...config, backgroundImage: '' };
                      setConfig(updatedConfig);
                      
                      try {
                        const response = await fetch('/api/server-config', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(updatedConfig),
                        });

                        if (response.ok) {
                          setMessage({ type: 'success', text: 'Background image removed and saved' });
                          onConfigUpdate?.();
                        } else {
                          setMessage({ type: 'error', text: 'Failed to save changes' });
                        }
                      } catch (error) {
                        setMessage({ type: 'error', text: 'Network error occurred' });
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-400 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative w-full h-24 rounded-lg overflow-hidden">
                  <img
                    src={config.backgroundImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Footer Image</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'footer')}
                className="hidden"
                id="footer-upload"
              />
              <label
                htmlFor="footer-upload"
                className="block w-full px-4 py-2 text-center border-2 border-dashed border-gray-300 
                         rounded-lg cursor-pointer hover:border-blue-500 transition-colors text-white"
              >
                {uploading === 'footer' ? 'Uploading...' : 'Upload Footer'}
              </label>
            </div>
            {config.footerImage && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-green-600">✓ Footer image uploaded</div>
                  <button
                    onClick={async () => {
                      const updatedConfig = { ...config, footerImage: '' };
                      setConfig(updatedConfig);
                      
                      try {
                        const response = await fetch('/api/server-config', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(updatedConfig),
                        });

                        if (response.ok) {
                          setMessage({ type: 'success', text: 'Footer image removed and saved' });
                          onConfigUpdate?.();
                        } else {
                          setMessage({ type: 'error', text: 'Failed to save changes' });
                        }
                      } catch (error) {
                        setMessage({ type: 'error', text: 'Network error occurred' });
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-400 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative w-full h-24 rounded-lg overflow-hidden">
                  <img
                    src={config.footerImage}
                    alt="Footer preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Logo Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Logo Image</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo')}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="block w-full px-4 py-2 text-center border-2 border-dashed border-gray-300 
                         rounded-lg cursor-pointer hover:border-blue-500 transition-colors text-white"
              >
                {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
              </label>
            </div>
            {config.logoImage && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-green-600">✓ Logo image uploaded</div>
                  <button
                    onClick={async () => {
                      const updatedConfig = { ...config, logoImage: '' };
                      setConfig(updatedConfig);
                      
                      try {
                        const response = await fetch('/api/server-config', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(updatedConfig),
                        });

                        if (response.ok) {
                          setMessage({ type: 'success', text: 'Logo image removed and saved' });
                          onConfigUpdate?.();
                        } else {
                          setMessage({ type: 'error', text: 'Failed to save changes' });
                        }
                      } catch (error) {
                        setMessage({ type: 'error', text: 'Network error occurred' });
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-400 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative w-full h-24 rounded-lg overflow-hidden">
                  <img
                    src={config.logoImage}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="mt-8 pt-6 border-t border-[#333230]">
        <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
        
        {passwordMessage && (
          <div className={`mb-4 p-4 rounded-lg ${
            passwordMessage.type === 'success' 
              ? 'bg-green-900/30 border border-green-700 text-green-200' 
              : 'bg-red-900/30 border border-red-700 text-red-200'
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <div className="bg-[#151413] rounded-lg p-6 border-2 border-[#333230] max-w-md">
          <h4 className="text-sm font-semibold text-white mb-4">Change Password</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#201F1D] text-white focus:border-[#580DA9] focus:outline-none"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#201F1D] text-white focus:border-[#580DA9] focus:outline-none"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#201F1D] text-white focus:border-[#580DA9] focus:outline-none"
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full bg-[#580DA9] text-white px-4 py-2 rounded-lg hover:bg-[#4A0B8F] disabled:bg-[#333230] disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? 'Changing Password...' : 'Change Password'}
            </button>

            <div className="text-xs text-gray-400">
              <p>• Password must be at least 8 characters long</p>
              <p>• You will need to sign in again after changing your password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 