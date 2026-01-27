import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brandId = parseInt(params.id);

    const models = await prisma.deviceModel.findMany({
      where: {
        brandId,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(models);
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { message: 'Failed to fetch models', error: error.message },
      { status: 500 }
    );
  }
}