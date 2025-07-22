import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServerConfigSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const config = await prisma.serverConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!config) {
      return NextResponse.json({ hasConfig: false });
    }

    const responseConfig = {
      title: config.title,
      subtitle: config.subtitle,
      prizeHeading: config.prizeHeading,
      redeemButtonText: config.redeemButtonText,
      footerText: config.footerText,
      footerTextPosition: config.footerTextPosition,
      footerImage: config.footerImage,
      footerUrl: config.footerUrl,
      backgroundImage: config.backgroundImage,
      logoImage: config.logoImage,
      showWave: config.showWave,
      panelAlignment: config.panelAlignment,
    };

    return NextResponse.json({
      hasConfig: true,
      config: responseConfig
    });
  } catch (error) {
    console.error('Error fetching server config:', error);
    return NextResponse.json({ error: 'Failed to fetch server config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate and transform the config data using Zod
    const validationResult = ServerConfigSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid configuration data', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }
    
    const configData = validationResult.data;

    // Upsert the config (create if doesn't exist, update if it does)
    const config = await prisma.serverConfig.upsert({
      where: { id: 1 },
      update: configData,
      create: configData,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Server configuration updated successfully',
      config 
    });
  } catch (error) {
    console.error('Error updating server config:', error);
    return NextResponse.json({ error: 'Failed to update server config' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Delete the server config
    await prisma.serverConfig.deleteMany();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Server configuration cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing server config:', error);
    return NextResponse.json({ error: 'Failed to clear server config' }, { status: 500 });
  }
} 