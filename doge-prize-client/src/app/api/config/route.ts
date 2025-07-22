import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { defaultConfig } from '../../../config/defaults';

export async function GET(request: NextRequest) {
  try {
    const env = process.env.CONFIG_ENV || 'development';
    const configPath = path.join(process.cwd(), 'config', `config.${env}.json`);
    
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to load config, using defaults:', error);
    // Return default configuration instead of error
    return NextResponse.json(defaultConfig);
  }
} 