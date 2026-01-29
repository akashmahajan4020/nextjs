import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
    context: { params: Promise<{ brandId: string }> }
) {
  try {
    const params = await context.params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const brandId = parseInt(params.brandId);
    const body = await request.json();
    const { name, status } = body;

    const model = await prisma.deviceModel.create({
      data: {
        brandId,
        name,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json({ message: 'Model created', model }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}