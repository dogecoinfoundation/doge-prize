"use client";

import { Config, defaultConfig } from './defaults';
import { ServerConfig } from '../backend';

class ConfigManager {
  private static instance: ConfigManager;
  private config: Config | null = null;
  private serverConfig: ServerConfig | null = null;
  private loadingPromise: Promise<Config> | null = null;
  private listeners: Set<() => void> = new Set();
  private serverUrl: string | null = null;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public async loadConfig(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) {
          console.warn(`Failed to fetch config: ${response.statusText}, using defaults`);
          this.config = defaultConfig;
          return this.config;
        }
        this.config = await response.json() as Config;
        return this.config;
      } catch (error) {
        console.error('Failed to load config from API endpoint, using defaults:', error);
        this.config = defaultConfig;
        return this.config;
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  public setServerConfig(serverConfig: ServerConfig | null, serverUrl?: string): void {
    this.serverConfig = serverConfig;
    if (serverUrl) {
      this.serverUrl = serverUrl;
    }
    this.notifyListeners();
  }

  private mergeConfigWithServerConfig(baseConfig: Config): Config {
    // If there's no server config, return the base config
    if (!this.serverConfig) {
      return baseConfig;
    }

    // Merge server config with base config (only non-null server values override base config)
    const mergedConfig = { ...baseConfig };
    
    // Helper function to construct full URLs for uploaded images
    const getImageUrl = (imagePath: string | null | undefined): string => {
      if (!imagePath) return '';
      
      // If it's already a full URL, return as is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      
      // If it's a relative path starting with /uploads/, construct full server URL
      if (imagePath.startsWith('/uploads/') && this.serverUrl) {
        return `${this.serverUrl}${imagePath}`;
      }
      
      // For other relative paths, return as is (client can handle these)
      return imagePath;
    };
    
    // Only override with non-null values from server config
    Object.entries(this.serverConfig).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        console.log(`Setting ${key} to:`, value);
        
        // Special handling for image fields
        if (['backgroundImage', 'footerImage', 'logoImage'].includes(key)) {
          (mergedConfig as any)[key] = getImageUrl(value as string);
        } else {
          (mergedConfig as any)[key] = value;
        }
      }
    });
    
    // Ensure string fields are never null/undefined for UI compatibility
    const stringFields = ['title', 'subtitle', 'prizeHeading', 'redeemButtonText', 'footerText', 'footerImage', 'footerUrl', 'backgroundImage', 'logoImage'];
    stringFields.forEach(field => {
      if ((mergedConfig as any)[field] === null || (mergedConfig as any)[field] === undefined) {
        (mergedConfig as any)[field] = '';
      }
    });
    
    return mergedConfig;
  }

  public async getConfig(): Promise<Config> {
    const baseConfig = await this.loadConfig();
    const mergedConfig = this.mergeConfigWithServerConfig(baseConfig);
    console.log('Final merged config:', mergedConfig);
    return mergedConfig;
  }

  public isConfigLoaded(): boolean {
    return this.config !== null;
  }

  public getConfigSync(): Config | null {
    if (!this.config) {
      return null;
    }

    const mergedConfig = this.mergeConfigWithServerConfig(this.config);
    console.log('Final merged config (sync):', mergedConfig);
    return mergedConfig;
  }

  public clearServerConfig(): void {
    this.serverConfig = null;
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const configManager = ConfigManager.getInstance();
export type { Config }; 