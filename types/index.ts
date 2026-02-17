export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  slot_name: string;
  slot_type: 'team'; // Only team now
  slot_order: number;
  created_at: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  scholar_number: string;
  gender: 'male' | 'female';
  created_at: string;
}

export interface TeamBooking {
  id: string;
  time_slot_id: string;
  club: 'xploit' | 'ecell';
  leader_user_id: string;
  team_name: string;
  is_completed: boolean;
  claim_expires_at: string | null;
  created_at: string;
  team_members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_booking_id: string;
  name: string;
  gender: 'male' | 'female';
  scholar_number: string;
  phone: string;
  is_leader: boolean;
  created_at: string;
}
