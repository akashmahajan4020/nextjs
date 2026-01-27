import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const policyId = parseInt(id);
    const body = await request.json();

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      return NextResponse.json({ message: 'Policy not found' }, { status: 404 });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { policyId },
    });

    if (existingPayment) {
      return NextResponse.json(
        { message: 'Payment already recorded' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        policyId,
        transactionId: body.transaction_id,
        paymentMethod: body.payment_method,
        amount: body.amount,
        status: body.status || 'SUCCESS',
        paidAt: new Date(),
        paymentDetails: body.details || null,
      },
    });

    if (payment.status === 'SUCCESS') {
      const invoiceNumber = `INV-${Date.now()}-${String(policyId).padStart(6, '0')}`;

      await prisma.invoice.create({
        data: {
          policyId,
          invoiceNumber,
          filepath: `invoices/${invoiceNumber}.pdf`,
        },
      });
    }

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment,
    });

  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}