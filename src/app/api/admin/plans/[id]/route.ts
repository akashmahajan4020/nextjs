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
    if (body.duration_months) updateData.durationMonths = body.duration_months;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.status) updateData.status = body.status;

    const plan = await prisma.insurancePlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Plan updated', plan });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);

    await prisma.insurancePlan.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Plan deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}