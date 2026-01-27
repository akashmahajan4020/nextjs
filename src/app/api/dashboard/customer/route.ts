import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const [totalPolicies, activePolicies, pendingPolicies, policies] = await Promise.all([
      prisma.policy.count({ where: { customerId: user.userId } }),
      prisma.policy.count({
        where: {
          customerId: user.userId,
          status: { in: ['APPROVED', 'ACTIVE'] },
        },
      }),
      prisma.policy.count({
        where: {
          customerId: user.userId,
          status: 'PENDING',
        },
      }),
      prisma.policy.findMany({
        where: { customerId: user.userId },
        include: {
          category: true,
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const totalPremium = await prisma.policy.aggregate({
      where: {
        customerId: user.userId,
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return NextResponse.json({
      stats: {
        total_policies: totalPolicies,
        active_policies: activePolicies,
        pending_policies: pendingPolicies,
        total_premium: totalPremium._sum.totalAmount || 0,
      },
      policies,
    });

  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}