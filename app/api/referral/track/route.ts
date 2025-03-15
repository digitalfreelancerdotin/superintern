import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('API: Received tracking request');
  
  try {
    const body = await request.json();
    console.log('API: Request body:', body);
    
    const { referralCode } = body;
    if (!referralCode) {
      console.log('API: No referral code provided');
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    console.log('API: Processing referral code:', referralCode);

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // First verify the referral code exists in profiles
    const { data: profileCheck, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('referral_code', referralCode)
      .single();

    console.log('API: Profile check:', { profileCheck, profileError });

    if (profileError || !profileCheck) {
      console.log('API: Invalid referral code');
      return NextResponse.json({ 
        error: 'Invalid referral code',
        details: profileError?.message || 'Code not found'
      }, { status: 400 });
    }

    // Get IP and User Agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    console.log('API: Visitor details:', { ip, userAgent });

    // Insert the visit
    const { data: visit, error: insertError } = await supabase
      .from('referral_visits')
      .insert([{
        referral_code: referralCode,
        visitor_ip: ip || 'unknown',
        user_agent: userAgent || 'unknown'
      }])
      .select();

    console.log('API: Insert result:', { visit, insertError });

    if (insertError) {
      console.error('API: Insert error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to record visit',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Visit recorded successfully',
      visit 
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to track visit',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 