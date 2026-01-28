import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const categoryId = parseInt(id);

    const plans = await prisma.insurancePlan.findMany({
      where: {
        categoryId,
        status: 'ACTIVE',
      },
      orderBy: { durationMonths: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { message: 'Failed to fetch plans', error: error.message },
      { status: 500 }
    );
  }
}