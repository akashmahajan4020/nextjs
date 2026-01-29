import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const policyId = parseInt(params.id);
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { message: 'Rejection reason is required' },
        { status: 422 }
      );
    }

    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'REJECTED',
        approvedBy: user.userId,
        rejectReason: reason,
      },
    });

    return NextResponse.json({
      message: 'Policy rejected',
      policy,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}