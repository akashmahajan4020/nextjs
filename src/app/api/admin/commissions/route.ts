import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const status = searchParams.get('status');

    const where: any = {};
    if (agentId) where.agentId = parseInt(agentId);
    if (status) where.status = status.toUpperCase();

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        policy: {
          select: {
            policyNumber: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ data: commissions });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}