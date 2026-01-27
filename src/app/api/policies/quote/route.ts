import { NextRequest, NextResponse } from 'next/server';
import { calculateQuote } from '@/lib/services/pricing';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const quote = await calculateQuote(body);

    return NextResponse.json({ quote });
  } catch (error: any) {
    console.error('Quote error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to calculate quote' },
      { status: 400 }
    );
  }
}
