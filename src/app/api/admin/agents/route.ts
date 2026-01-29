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
    const status = searchParams.get('status');

    const where: any = { role: 'AGENT' };

    if (status) {
      where.agent = {
        status: status.toUpperCase(),
      };
    }

    const agents = await prisma.user.findMany({
      where,
      include: {
        agent: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ data: agents });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}