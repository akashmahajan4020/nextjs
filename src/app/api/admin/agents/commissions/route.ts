import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const commissions = await prisma.commission.findMany({
      where: {
        agentId: user.userId,
      },
      include: {
        policy: {
          select: {
            policyNumber: true,
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