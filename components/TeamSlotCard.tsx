'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimeSlot, TeamBooking } from '@/types';
import TeamClaimModal from './TeamClaimModal';
import TeamDetailsModal from './TeamDetailsModal';

interface Props {
  slot: TimeSlot;
  club: 'xploit' | 'ecell';
  teamBooking?: TeamBooking;
  onRefresh: () => void;
}

export default function TeamSlotCard({ slot, club, teamBooking, onRefresh }: Props) {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!teamBooking?.claim_expires_at || teamBooking.is_completed) {
      setTimeRemaining(0);
      return;
    }

    const calculateTime = () => {
      // Current time in UTC
      const now = new Date();
      
      // Parse expiry time - ensure it's treated as UTC
      // If string doesn't have 'Z', add it to force UTC parsing
      let expiryString = teamBooking.claim_expires_at;
      if (!expiryString.endsWith('Z') && !expiryString.includes('+')) {
        expiryString = expiryString + 'Z';
      }
      const expiresAt = new Date(expiryString);
      
      // Calculate difference in milliseconds, then convert to seconds
      const diffMs = expiresAt.getTime() - now.getTime();
      const remaining = Math.max(0, Math.floor(diffMs / 1000));
      
      setTimeRemaining(remaining);

      // If expired, refresh after 1 second
      if (remaining === 0 && timeRemaining > 0) {
        setTimeout(() => onRefresh(), 1000);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [teamBooking?.claim_expires_at, teamBooking?.is_completed, onRefresh, timeRemaining]);

  const isClaiming = teamBooking && !teamBooking.is_completed && timeRemaining > 0;
  const isBooked = teamBooking?.is_completed;

  const getStatus = () => {
    if (isBooked) {
      return { 
        color: 'border-red-500 bg-red-500/10', 
        text: 'BOOKED', 
        canClaim: false 
      };
    }
    if (isClaiming) {
      return { 
        color: 'border-yellow-500 bg-yellow-500/10', 
        text: 'CLAIMING...', 
        canClaim: false 
      };
    }
    return { 
      color: 'border-green-500 bg-green-500/10 hover:shadow-neon-green', 
      text: 'TEAM SLOT', 
      canClaim: true 
    };
  };

  const status = getStatus();

  const handleClick = () => {
    if (isBooked) {
      setShowDetailsModal(true);
    } else if (status.canClaim) {
      setShowClaimModal(true);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.button
        onClick={handleClick}
        className={`glass-panel p-3 border-2 w-full text-left transition-all min-h-[88px] ${status.color}`}
        whileHover={{ scale: status.canClaim ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex justify-between items-start h-full">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs md:text-sm font-bold mb-1">{slot.slot_name}</div>
              <div className={`text-xs ${isBooked ? 'text-red-400' : isClaiming ? 'text-yellow-400' : 'text-green-400'}`}>
                {status.text}
              </div>
            </div>
            <div className="mt-1">
              {isBooked && teamBooking && (
                <div className="text-xs text-gray-400">
                  Team: {teamBooking.team_name}
                </div>
              )}
              {isClaiming && timeRemaining > 0 && (
                <div className="text-xs text-yellow-400 font-mono flex items-center gap-1">
                  <span className="animate-pulse">⏱️</span>
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
          <div className={`text-xs px-2 py-1 rounded whitespace-nowrap h-fit ${club === 'xploit' ? 'bg-xploit-primary/20 text-xploit-primary' : 'bg-ecell-primary/20 text-ecell-primary'}`}>
            4 MEMBERS
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {showClaimModal && (
          <TeamClaimModal
            slot={slot}
            club={club}
            onClose={() => {
              setShowClaimModal(false);
              onRefresh();
            }}
            onSuccess={onRefresh}
          />
        )}
        {showDetailsModal && teamBooking && (
          <TeamDetailsModal
            teamBooking={teamBooking}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
