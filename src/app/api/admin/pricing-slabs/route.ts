import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    const where = categoryId ? { categoryId: parseInt(categoryId) } : {};

    const slabs = await prisma.pricingSlab.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { minValue: 'asc' },
    });

    return NextResponse.json(slabs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category_id,
      min_value,
      max_value,
      base_premium,
      duration_multiplier,
      gst_rate,
      commission_percent,
      status,
    } = body;

    const slab = await prisma.pricingSlab.create({
      data: {
        categoryId: category_id,
        minValue: min_value,
        maxValue: max_value,
        basePremium: base_premium,
        durationMultiplier: duration_multiplier,
        gstRate: gst_rate,
        commissionPercent: commission_percent,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json({ message: 'Pricing slab created', slab }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}