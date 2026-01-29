import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalCustomers,
      totalAgents,
      totalPolicies,
      pendingPolicies,
      approvedPolicies,
      rejectedPolicies,
      recentPolicies,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ 
        where: { 
          role: 'AGENT',
          status: 'ACTIVE',
        } 
      }),
      prisma.policy.count(),
      prisma.policy.count({ where: { status: 'PENDING' } }),
      prisma.policy.count({ where: { status: 'APPROVED' } }),
      prisma.policy.count({ where: { status: 'REJECTED' } }),
      prisma.policy.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const revenueResult = await prisma.policy.aggregate({
      where: {
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const pendingCommissions = await prisma.commission.aggregate({
      where: { status: 'PENDING' },
      _sum: { commissionAmount: true },
    });

    const approvedCommissions = await prisma.commission.aggregate({
      where: { status: 'APPROVED' },
      _sum: { commissionAmount: true },
    });

    const pendingPayouts = await prisma.payout.aggregate({
      where: { status: 'REQUESTED' },
      _sum: { amount: true },
    });

    const pendingPayoutCount = await prisma.payout.count({
      where: { status: 'REQUESTED' },
    });

    return NextResponse.json({
      stats: {
        total_customers: totalCustomers,
        total_agents: totalAgents,
        pending_agents: 0, // You can add this if needed
        total_policies: totalPolicies,
        pending_policies: pendingPolicies,
        approved_policies: approvedPolicies,
        rejected_policies: rejectedPolicies,
        total_revenue: revenueResult._sum.totalAmount || 0,
        pending_commissions: pendingCommissions._sum.commissionAmount || 0,
        approved_commissions: approvedCommissions._sum.commissionAmount || 0,
        pending_payouts: pendingPayouts._sum.amount || 0,
        pending_payout_count: pendingPayoutCount,
      },
      recent_policies: recentPolicies,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}