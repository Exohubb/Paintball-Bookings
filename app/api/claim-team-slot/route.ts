import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  timeSlotId: z.string().uuid(),
  club: z.enum(['xploit', 'ecell']),
  teamName: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { timeSlotId, club, teamName } = schema.parse(body);

    const authToken = req.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(authToken);
    
    if (!payload || !payload.phone) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const phone = payload.phone as string;
    const supabase = await createClient();

    // Get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Call claim function
    const { data, error } = await supabase
      .rpc('claim_team_slot', {
        p_user_id: user.id,
        p_time_slot_id: timeSlotId,
        p_club: club,
        p_team_name: teamName,
      });

    if (error || !data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to claim slot' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      team_booking_id: data.team_booking_id,
    });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
