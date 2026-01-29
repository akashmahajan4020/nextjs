import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const [totalEarned, pending, approved, paid] = await Promise.all([
      prisma.commission.aggregate({
        where: { agentId: user.userId },
        _sum: { commissionAmount: true },
      }),
      prisma.commission.aggregate({
        where: { agentId: user.userId, status: 'PENDING' },
        _sum: { commissionAmount: true },
      }),
      prisma.commission.aggregate({
        where: { agentId: user.userId, status: 'APPROVED' },
        _sum: { commissionAmount: true },
      }),
      prisma.commission.aggregate({
        where: { agentId: user.userId, status: 'PAID' },
        _sum: { commissionAmount: true },
      }),
    ]);

    return NextResponse.json({
      total_earned: totalEarned._sum.commissionAmount || 0,
      pending: pending._sum.commissionAmount || 0,
      approved: approved._sum.commissionAmount || 0,
      paid: paid._sum.commissionAmount || 0,
      available_for_payout: approved._sum.commissionAmount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}