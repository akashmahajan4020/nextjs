import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const policyId = parseInt(params.id);

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        category: true,
        plan: true,
        customer: {
          include: {
            customer: true,
          },
        },
        agent: true,
        items: {
          include: {
            brand: true,
            model: true,
          },
        },
        addons: {
          include: {
            addon: true,
          },
        },
        documents: true,
        payment: true,
        invoice: true,
      },
    });

    if (!policy) {
      return NextResponse.json({ message: 'Policy not found' }, { status: 404 });
    }

    // Check authorization
    if (user.role === 'CUSTOMER' && policy.customerId !== user.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'AGENT' && policy.agentId !== user.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ policy });

  } catch (error: any) {
    console.error('Get policy error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}