"use client";

import { useState, useEffect } from 'react';
import { configManager, Config } from './index';

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const loadedConfig = await configManager.getConfig();
        setConfig(loadedConfig);
      } catch (err) {
        // This should never happen now since configManager always returns a valid config
        console.error('Unexpected error loading config:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();

    // Subscribe to config changes
    const unsubscribe = configManager.subscribe(() => {
      loadConfig();
    });

    return unsubscribe;
  }, []);

  return { config, loading, error: null };
} 