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

    const policyId = parseInt(params.id);

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: { plan: true },
    });

    if (!policy) {
      return NextResponse.json({ message: 'Policy not found' }, { status: 404 });
    }

    if (policy.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Policy is not in pending state' },
        { status: 400 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + policy.plan.durationMonths);

    // Update policy
    const updatedPolicy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: user.userId,
        startDate,
        endDate,
      },
      include: {
        category: true,
        plan: true,
        customer: true,
      },
    });

    // Create commission if agent involved
    if (policy.agentId) {
      // Get commission percent from pricing slab
      const slab = await prisma.pricingSlab.findFirst({
        where: {
          categoryId: policy.categoryId,
          minValue: { lte: policy.basePremium },
          maxValue: { gte: policy.basePremium },
        },
      });

      if (slab) {
        const commissionPercent = Number(slab.commissionPercent);
        const commissionAmount = (Number(policy.basePremium) * commissionPercent) / 100;

        await prisma.commission.create({
          data: {
            policyId: policy.id,
            agentId: policy.agentId,
            premiumAmount: policy.basePremium,
            commissionPercent,
            commissionAmount,
            status: 'PENDING',
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Policy approved successfully',
      policy: updatedPolicy,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}