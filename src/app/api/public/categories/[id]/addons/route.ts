import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }

) {
  try {
    const { id } = await context.params;
    const categoryId = parseInt(id);

    const addons = await prisma.addon.findMany({
      where: {
        categoryId,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(addons);
  } catch (error: any) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { message: 'Failed to fetch addons', error: error.message },
      { status: 500 }
    );
  }
}