import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // With JWT, logout is handled client-side by removing the token
  return NextResponse.json({ message: 'Logged out successfully' });
}