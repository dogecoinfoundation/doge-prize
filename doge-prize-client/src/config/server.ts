import { promises as fs } from 'fs';
import path from 'path';

interface ServerConfig {
  pageTitle: string;
  pageDescription: string;
}

export async function getServerConfig(): Promise<ServerConfig> {
  try {
    const env = process.env.CONFIG_ENV || 'development';
    const configPath = path.join(process.cwd(), 'config', `config.${env}.json`);
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    return {
      pageTitle: config.pageTitle || 'Doge Prize',
      pageDescription: config.pageDescription || 'Dogecoin Doge Prize',
    };
  } catch (error) {
    console.error('Failed to load server config:', error);
    // Fallback values
    return {
      pageTitle: 'Doge Prize',
      pageDescription: 'Dogecoin Doge Prize',
    };
  }
} 