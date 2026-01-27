import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { calculateQuote } from '@/lib/services/pricing';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category_id,
      plan_id,
      invoice_value,
      duration_months,
      addon_ids = [],
      items = [],
    } = body;

    // Calculate quote
    const quote = await calculateQuote({
      category_id,
      invoice_value,
      duration_months,
      addon_ids,
    });

    // Generate policy number
    const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create policy
    const policy = await prisma.policy.create({
      data: {
        policyNumber,
        categoryId: category_id,
        planId: plan_id,
        customerId: user.role === 'CUSTOMER' ? user.userId : body.customer_id,
        agentId: user.role === 'AGENT' ? user.userId : null,
        status: 'PENDING',
        basePremium: quote.premium_after_duration,
        addonsTotal: quote.addons_total,
        discount: quote.discount,
        gstAmount: quote.gst_amount,
        totalAmount: quote.grand_total,
      },
    });

    // Create policy items
    for (const item of items) {
      await prisma.policyItem.create({
        data: {
          policyId: policy.id,
          itemType: item.item_type,
          brandId: item.brand_id || null,
          modelId: item.model_id || null,
          invoiceValue: item.invoice_value,
          purchaseDate: item.purchase_date ? new Date(item.purchase_date) : null,
          serialNumber: item.serial_number || null,
          details: item.details || null,
        },
      });
    }

    // Create policy addons
    for (const addon of quote.addons) {
      await prisma.policyAddon.create({
        data: {
          policyId: policy.id,
          addonId: addon.addon_id,
          price: addon.price,
        },
      });
    }

    // Fetch complete policy
    const completePolicy = await prisma.policy.findUnique({
      where: { id: policy.id },
      include: {
        category: true,
        plan: true,
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
      },
    });

    return NextResponse.json({
      message: 'Policy created successfully',
      policy: completePolicy,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create policy error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create policy' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let where: any = {};

    if (user.role === 'CUSTOMER') {
      where.customerId = user.userId;
    } else if (user.role === 'AGENT') {
      where.agentId = user.userId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const policies = await prisma.policy.findMany({
      where,
      include: {
        category: true,
        plan: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    return NextResponse.json({ data: policies });

  } catch (error: any) {
    console.error('Get policies error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}
