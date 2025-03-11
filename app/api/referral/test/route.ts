import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Test database connection
    const { data, error } = await supabase
      .from('referral_visits')
      .select('*')
      .limit(1);

    return NextResponse.json({ 
      message: 'Test endpoint working',
      dbTest: { data, error },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Test failed', details: error.message }, { status: 500 });
  }
} 