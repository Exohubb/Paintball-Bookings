import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const memberSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['male', 'female']),
  scholar_number: z.string().min(1),
  phone: z.string().min(10),
  is_leader: z.boolean(),
});

const schema = z.object({
  teamBookingId: z.string().uuid(),
  members: z.array(memberSchema).length(4),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 Received request body:', JSON.stringify(body, null, 2));

    // Validate input
    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid data format', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { teamBookingId, members } = validationResult.data;

    const supabase = await createClient();

    console.log('🔄 Calling add_team_members function...');
    
    // Call add members function
    const { data, error } = await supabase.rpc('add_team_members', {
      p_team_booking_id: teamBookingId,
      p_members: members, // Pass as array directly, not JSON string
    });

    console.log('📤 RPC Response:', { data, error });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 400 }
      );
    }

    if (data && !data.success) {
      console.error('❌ Function returned error:', data.error);
      return NextResponse.json(
        { error: data.error || 'Failed to add members' },
        { status: 400 }
      );
    }

    console.log('✅ Team booking completed successfully');
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
