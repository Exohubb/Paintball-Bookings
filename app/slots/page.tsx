'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { TimeSlot, TeamBooking } from '@/types';
import TeamSlotCard from '@/components/TeamSlotCard';
import TeamClaimModal from '@/components/TeamClaimModal';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [teamBookings, setTeamBookings] = useState<Map<string, TeamBooking>>(new Map());
  const [loading, setLoading] = useState(true);
  const [pendingBooking, setPendingBooking] = useState<TeamBooking | null>(null);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const lastFetchRef = useRef<string>('');

  const supabase = createClient();

  useEffect(() => {
    fetchAllData();
    
    // Handle page visibility - stop polling when tab is hidden
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // SMART POLLING: 
    // - 10 seconds when page is active (instead of 3)
    // - Stop when page is hidden (saves 50% requests)
    const interval = setInterval(() => {
      if (isPageVisible) {
        fetchAllData();
      }
    }, 10000); // Reduced from 3s to 10s = 70% fewer requests

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPageVisible]);

  const fetchAllData = async () => {
    try {
      // Fetch slots (rarely changes, could be cached)
      const { data: slotsData } = await supabase
        .from('time_slots')
        .select('*')
        .order('slot_order', { ascending: true });

      if (slotsData) {
        setSlots(slotsData);
      }

      // Fetch team bookings with members
      const { data: teamData } = await supabase
        .from('team_bookings')
        .select(`
          *,
          team_members (*),
          time_slots (slot_name)
        `);

      // Check if data actually changed (avoid unnecessary re-renders)
      const newDataHash = JSON.stringify(teamData);
      if (newDataHash === lastFetchRef.current) {
        return; // No changes, skip update
      }
      lastFetchRef.current = newDataHash;

      if (teamData) {
        const teamMap = new Map();
        teamData.forEach(booking => {
          const key = `${booking.time_slot_id}-${booking.club}`;
          teamMap.set(key, booking);
        });
        setTeamBookings(teamMap);
      }

      await checkPendingBooking();
      setLoading(false);
      
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const checkPendingBooking = async () => {
    const phone = getCookie('temp_phone');
    if (!phone) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (!user) return;

    const { data: pending } = await supabase
      .from('team_bookings')
      .select(`
        *,
        time_slots (slot_name)
      `)
      .eq('leader_user_id', user.id)
      .eq('is_completed', false)
      .gt('claim_expires_at', new Date().toISOString())
      .single();

    setPendingBooking(pending);
  };

  const handleCancelPending = async () => {
    if (!pendingBooking) return;

    await supabase
      .from('team_bookings')
      .delete()
      .eq('id', pendingBooking.id);

    setPendingBooking(null);
    fetchAllData();
  };

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Paintball Championship 2026</h1>
          <p className="text-gray-400 text-sm">Feb 21, 2026 • 10:00 AM - 6:40 PM</p>
        </motion.div>

        {/* Continue Booking Banner */}
        <AnimatePresence>
          {pendingBooking && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel p-4 mb-4 border-2 border-yellow-500"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-lg">⚠️</span>
                    <h3 className="font-bold text-yellow-400">Incomplete Booking</h3>
                  </div>
                  <p className="text-sm text-gray-300">
                    You have a pending booking for <span className="font-semibold">{pendingBooking.time_slots?.slot_name}</span> ({pendingBooking.club.toUpperCase()})
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Team: {pendingBooking.team_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setShowContinueModal(true)}
                    className="btn-xploit px-6"
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue Booking
                  </motion.button>
                  <motion.button
                    onClick={handleCancelPending}
                    className="btn-primary bg-red-500/20 border-2 border-red-500 text-red-400 px-4"
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="glass-panel p-3 mb-4 flex flex-wrap justify-center gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Claiming...</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Booked</span>
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {/* Xploit Side */}
          <div className="space-y-2">
            <div className="glass-panel p-2 md:p-3 text-center sticky top-0 z-10">
              <h2 className="text-xl md:text-2xl font-bold text-xploit-primary">XPLOIT</h2>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass-panel h-24 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => {
                  const bookingKey = `${slot.id}-xploit`;
                  const teamBooking = teamBookings.get(bookingKey);
                  
                  return (
                    <TeamSlotCard
                      key={slot.id}
                      slot={slot}
                      club="xploit"
                      teamBooking={teamBooking}
                      onRefresh={fetchAllData}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Ecell Side */}
          <div className="space-y-2">
            <div className="glass-panel p-2 md:p-3 text-center sticky top-0 z-10">
              <h2 className="text-xl md:text-2xl font-bold text-ecell-primary">ECELL</h2>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass-panel h-24 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => {
                  const bookingKey = `${slot.id}-ecell`;
                  const teamBooking = teamBookings.get(bookingKey);
                  
                  return (
                    <TeamSlotCard
                      key={slot.id}
                      slot={slot}
                      club="ecell"
                      teamBooking={teamBooking}
                      onRefresh={fetchAllData}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue Modal */}
      <AnimatePresence>
        {showContinueModal && pendingBooking && (
          <TeamClaimModal
            slot={{
              id: pendingBooking.time_slot_id,
              slot_name: pendingBooking.time_slots?.slot_name || '',
              slot_type: 'team',
              start_time: '',
              end_time: '',
              slot_order: 0,
              created_at: '',
            }}
            club={pendingBooking.club}
            existingBookingId={pendingBooking.id}
            existingTeamName={pendingBooking.team_name}
            onClose={() => {
              setShowContinueModal(false);
              fetchAllData();
            }}
            onSuccess={() => {
              setShowContinueModal(false);
              setPendingBooking(null);
              fetchAllData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

