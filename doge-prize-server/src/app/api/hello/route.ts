import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to handle null values - only use server value if it's not null
const getValueOrDefault = (value: string | null | undefined, defaultValue: string) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value;
};



// This is a test endpoint used by the client to check if the server is running and accessible
export async function GET() {
  try {
    // Get server configuration
    const serverConfig = await prisma.serverConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    const config = serverConfig ? {
      title: getValueOrDefault(serverConfig.title, 'Doge Prize'),
      subtitle: getValueOrDefault(serverConfig.subtitle, 'Prizes in Dogecoin!'),
      prizeHeading: getValueOrDefault(serverConfig.prizeHeading, 'Enter your code below to reveal your prize!'),
      redeemButtonText: getValueOrDefault(serverConfig.redeemButtonText, 'Look inside'),
      footerText: getValueOrDefault(serverConfig.footerText, 'Do Only Good Everyday'),
      footerTextPosition: getValueOrDefault(serverConfig.footerTextPosition, 'below'),
      footerImage: getValueOrDefault(serverConfig.footerImage, '/footer.png'),
      footerUrl: getValueOrDefault(serverConfig.footerUrl, 'https://dogecoin.com'),
      backgroundImage: getValueOrDefault(serverConfig.backgroundImage, '/background.png'),
      logoImage: getValueOrDefault(serverConfig.logoImage, ''),
      showWave: serverConfig.showWave ?? false,
      panelAlignment: getValueOrDefault(serverConfig.panelAlignment, 'left'),
    } : null;

    const response = {
      message: 'hello',
      hasCustomConfig: !!serverConfig,
      config
    };

    return new NextResponse(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in hello endpoint:', error);
    return new NextResponse('hello', {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
} 