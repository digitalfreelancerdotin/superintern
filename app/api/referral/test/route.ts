import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.from('referral_codes').select('*').limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Test successful',
      data,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Test failed', details: errorMessage }, { status: 500 });
  }
} 