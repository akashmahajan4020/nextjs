import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        agentPolicies: {
          some: {
            agentId: user.userId,
          },
        },
      },
      include: {
        customer: true,
      },
      distinct: ['id'],
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ data: customers });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, password, address, city, state, pincode } = body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 422 }
      );
    }

    const hashedPassword = await hashPassword(password || 'Welcome@123');

    const customer = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    await prisma.customer.create({
      data: {
        userId: customer.id,
        address,
        city,
        state,
        pincode,
      },
    });

    const customerWithRelations = await prisma.user.findUnique({
      where: { id: customer.id },
      include: { customer: true },
    });

    return NextResponse.json({
      message: 'Customer created successfully',
      customer: customerWithRelations,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
