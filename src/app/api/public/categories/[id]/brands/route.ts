import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);

    const brands = await prisma.brand.findMany({
      where: {
        categoryId,
        status: 'ACTIVE',
      },
      include: {
        models: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(brands);
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { message: 'Failed to fetch brands', error: error.message },
      { status: 500 }
    );
  }
}