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
      try {
        const now = new Date();
        let expiryTimeString = teamBooking.claim_expires_at;
        expiryTimeString = expiryTimeString.replace(' ', 'T');
        if (!expiryTimeString.includes('+') && !expiryTimeString.endsWith('Z')) {
          expiryTimeString = expiryTimeString + 'Z';
        }
        
        const expiresAt = new Date(expiryTimeString);
        if (isNaN(expiresAt.getTime())) {
          setTimeRemaining(0);
          return;
        }
        
        const diffMs = expiresAt.getTime() - now.getTime();
        const remaining = Math.max(0, Math.floor(diffMs / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0 && timeRemaining > 0) {
          setTimeout(() => onRefresh(), 1000);
        }
      } catch (error) {
        setTimeRemaining(0);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.button
        onClick={handleClick}
        className={`glass-panel border-2 w-full text-left transition-all h-[95px] ${status.color}`}
        whileHover={{ scale: status.canClaim ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="h-full p-3 flex flex-col justify-between">
          {/* Line 1: Time Slot */}
          <div className="text-xs md:text-sm font-bold">
            {slot.slot_name}
          </div>

          {/* Line 2: Status + 4 Members Badge */}
          <div className="flex justify-between items-center">
            <div className={`text-xs font-medium ${isBooked ? 'text-red-400' : isClaiming ? 'text-yellow-400' : 'text-green-400'}`}>
              {status.text}
            </div>
            <div className={`text-xs px-2 py-1 rounded whitespace-nowrap ${club === 'xploit' ? 'bg-xploit-primary/20 text-xploit-primary' : 'bg-ecell-primary/20 text-ecell-primary'}`}>
              4 MEMBERS
            </div>
          </div>

          {/* Line 3: Extra Info (Timer/Team Name) */}
          <div className="min-h-[18px] flex items-center">
            {isBooked && teamBooking && (
              <div className="text-xs text-gray-400 truncate">
                Team: {teamBooking.team_name}
              </div>
            )}
            {isClaiming && timeRemaining > 0 && (
              <div className="text-xs text-yellow-400 font-mono flex items-center gap-1">
                <span className="animate-pulse">⏱️</span>
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
            {!isBooked && !isClaiming && (
              <div className="text-xs text-gray-500">
                Click to claim slot
              </div>
            )}
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
