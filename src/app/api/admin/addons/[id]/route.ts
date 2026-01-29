import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  constext: { params: Promise<{ id: string }> }
) {
  try {
    const params = await constext.params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    const body = await request.json();

    const updateData: any = {};
    if (body.category_id) updateData.categoryId = body.category_id;
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price_type) updateData.priceType = body.price_type;
    if (body.price_value) updateData.priceValue = body.price_value;
    if (body.status) updateData.status = body.status;

    const addon = await prisma.addon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Addon updated', addon });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);

    await prisma.addon.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Addon deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}