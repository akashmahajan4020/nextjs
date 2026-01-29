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
    const body = await request.json();
    const { transaction_reference } = body;

    if (!transaction_reference) {
      return NextResponse.json(
        { message: 'Transaction reference is required' },
        { status: 422 }
      );
    }

    const payout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        transactionReference: transaction_reference,
      },
    });

    // Mark commissions as paid
    const commissions = await prisma.commission.findMany({
      where: {
        agentId: payout.agentId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'asc' },
    });

    let remainingAmount = Number(payout.amount);

    for (const commission of commissions) {
      if (remainingAmount <= 0) break;

      const commissionAmount = Number(commission.commissionAmount);
      if (commissionAmount <= remainingAmount) {
        await prisma.commission.update({
          where: { id: commission.id },
          data: { status: 'PAID' },
        });
        remainingAmount -= commissionAmount;
      }
    }

    return NextResponse.json({
      message: 'Payout marked as paid',
      payout,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}