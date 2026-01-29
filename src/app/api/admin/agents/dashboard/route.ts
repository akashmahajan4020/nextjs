import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'AGENT') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const [
            totalCustomers,
            totalPolicies,
            pendingPolicies,
            approvedPolicies,
            commissionStats,
            recentPolicies,
        ] = await Promise.all([
            prisma.user.count({
                where: {
                    role: 'CUSTOMER',
                    agentPolicies: {
                        some: {
                            agentId: user.userId,
                        },
                    },
                },
            }),

            prisma.policy.count({ where: { agentId: user.userId } }),
            prisma.policy.count({ where: { agentId: user.userId, status: 'PENDING' } }),
            prisma.policy.count({ where: { agentId: user.userId, status: 'APPROVED' } }),
            prisma.commission.aggregate({
                where: { agentId: user.userId },
                _sum: { commissionAmount: true },
            }),
            prisma.policy.findMany({
                where: { agentId: user.userId },
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

        const [pendingCommission, approvedCommission, paidCommission] = await Promise.all([
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
            stats: {
                total_customers: totalCustomers,
                total_policies: totalPolicies,
                pending_policies: pendingPolicies,
                approved_policies: approvedPolicies,
                total_commission: commissionStats._sum.commissionAmount || 0,
                pending_commission: pendingCommission._sum.commissionAmount || 0,
                approved_commission: approvedCommission._sum.commissionAmount || 0,
                paid_commission: paidCommission._sum.commissionAmount || 0,
            },
            recent_policies: recentPolicies,
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}