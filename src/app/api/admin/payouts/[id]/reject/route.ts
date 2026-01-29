import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payoutId = parseInt(params.id);
    const body = await request.json();
    const { remarks } = body;

    const payout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'REJECTED',
        approvedBy: user.userId,
        remarks,
      },
    });

    return NextResponse.json({
      message: 'Payout rejected',
      payout,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}