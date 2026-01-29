import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.id);

    await prisma.agent.update({
      where: { userId },
      data: { status: 'REJECTED' },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json({ message: 'Agent rejected' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}