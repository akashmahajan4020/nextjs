import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.insuranceCategory.findMany({
      include: {
        _count: {
          select: {
            plans: true,
            addons: true,
            brands: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform _count to match frontend expectations
    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      plans_count: cat._count.plans,
      addons_count: cat._count.addons,
      brands_count: cat._count.brands,
    }));

    return NextResponse.json(categoriesWithCounts);
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
    const { name, description, icon, status } = body;

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 422 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const category = await prisma.insuranceCategory.create({
      data: {
        name,
        slug,
        description,
        icon,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json({ message: 'Category created', category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
