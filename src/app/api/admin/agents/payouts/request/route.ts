import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount < 100) {
      return NextResponse.json(
        { message: 'Minimum payout amount is ₹100' },
        { status: 422 }
      );
    }

    // Check available balance
    const approvedCommissions = await prisma.commission.aggregate({
      where: {
        agentId: user.userId,
        status: 'APPROVED',
      },
      _sum: {
        commissionAmount: true,
      },
    });

    const availableBalance = approvedCommissions._sum.commissionAmount || 0;

    if (amount > availableBalance) {
      return NextResponse.json(
        { message: 'Amount exceeds available balance' },
        { status: 400 }
      );
    }

    const payout = await prisma.payout.create({
      data: {
        agentId: user.userId,
        amount,
        status: 'REQUESTED',
        requestedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Payout requested successfully',
      payout,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}