import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  constext: { params: Promise<{ id: string }> }
) {
  try {
    const params = await constext.params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payoutId = parseInt(params.id);

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return NextResponse.json({ message: 'Payout not found' }, { status: 404 });
    }

    if (payout.status !== 'REQUESTED') {
      return NextResponse.json(
        { message: 'Payout is not in requested state' },
        { status: 400 }
      );
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedBy: user.userId,
      },
    });

    return NextResponse.json({
      message: 'Payout approved',
      payout: updatedPayout,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}