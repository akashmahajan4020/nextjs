import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, password_confirmation, role, address, city, state, pincode } = body;

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 422 }
      );
    }

    if (password !== password_confirmation) {
      return NextResponse.json(
        { message: 'Passwords do not match' },
        { status: 422 }
      );
    }

    if (!['AGENT', 'CUSTOMER'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role' },
        { status: 422 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 422 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role as any,
        status: role === 'AGENT' ? 'PENDING' : 'ACTIVE',
      },
    });

    // Create role-specific record
    if (role === 'AGENT') {
      await prisma.agent.create({
        data: {
          userId: user.id,
          status: 'PENDING',
        },
      });
    } else {
      await prisma.customer.create({
        data: {
          userId: user.id,
          address,
          city,
          state,
          pincode,
        },
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Fetch user with relations
    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        agent: role === 'AGENT',
        customer: role === 'CUSTOMER',
      },
    });

    return NextResponse.json({
      message: 'Registration successful',
      user: userWithRelations,
      token,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Registration failed', error: error.message },
      { status: 500 }
    );
  }
}