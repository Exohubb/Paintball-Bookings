'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TimeSlot } from '@/types';

interface Props {
  slot: TimeSlot;
  club: 'xploit' | 'ecell';
  existingBookingId?: string;
  existingTeamName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Member {
  name: string;
  gender: 'male' | 'female';
  scholar_number: string;
  phone: string;
  is_leader: boolean;
}

export default function TeamClaimModal({ 
  slot, 
  club, 
  existingBookingId,
  existingTeamName,
  onClose, 
  onSuccess 
}: Props) {
  const [step, setStep] = useState<'claim' | 'members'>(existingBookingId ? 'members' : 'claim');
  const [teamName, setTeamName] = useState(existingTeamName || '');
  const [teamBookingId, setTeamBookingId] = useState(existingBookingId || '');
  const [members, setMembers] = useState<Member[]>([
    { name: '', gender: 'male', scholar_number: '', phone: '', is_leader: true },
    { name: '', gender: 'male', scholar_number: '', phone: '', is_leader: false },
    { name: '', gender: 'male', scholar_number: '', phone: '', is_leader: false },
    { name: '', gender: 'male', scholar_number: '', phone: '', is_leader: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(240);

  useEffect(() => {
    if (step === 'members' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setError('Time expired! Slot released.');
            setTimeout(onClose, 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft, onClose]);

  const handleClaim = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/claim-team-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlotId: slot.id,
          club,
          teamName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTeamBookingId(data.team_booking_id);
        setStep('members');
      } else {
        setError(data.error || 'Failed to claim slot');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMembers = async () => {
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.scholar_number.trim() || !m.phone.trim()) {
        setError(`Please fill all details for member ${i + 1}`);
        return;
      }
      if (m.phone.length < 10) {
        setError(`Invalid phone for member ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/add-team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamBookingId,
          members,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to add members');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const updateMember = (index: number, field: keyof Member, value: any) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel p-6 max-w-2xl w-full my-8"
      >
        {step === 'claim' ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Claim Team Slot</h2>
            <div className="text-sm text-gray-400 mb-4">{slot.slot_name}</div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="input-field"
                maxLength={50}
              />
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={handleClaim}
                disabled={loading}
                className={club === 'xploit' ? 'btn-xploit flex-1' : 'btn-ecell flex-1'}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Claiming...' : 'Claim Slot (4 min to complete)'}
              </motion.button>
              <motion.button
                onClick={onClose}
                className="btn-primary bg-white/10 flex-1"
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">Add Team Members</h2>
                <div className="text-sm text-gray-400">Team: {teamName}</div>
              </div>
              <div className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {members.map((member, index) => (
                <div key={index} className="glass-panel p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Member {index + 1} {index === 0 && '(Leader)'}</h3>
                    <select
                      value={member.gender}
                      onChange={(e) => updateMember(index, 'gender', e.target.value)}
                      className="input-field w-32 py-2"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                    placeholder="Full Name"
                    className="input-field"
                  />
                  
                  <input
                    type="text"
                    value={member.scholar_number}
                    onChange={(e) => updateMember(index, 'scholar_number', e.target.value)}
                    placeholder="Scholar Number"
                    className="input-field"
                  />
                  
                  <input
                    type="tel"
                    value={member.phone}
                    onChange={(e) => updateMember(index, 'phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="Phone Number"
                    maxLength={10}
                    className="input-field"
                  />
                </div>
              ))}
            </div>

            <motion.button
              onClick={handleSubmitMembers}
              disabled={loading}
              className={`w-full ${club === 'xploit' ? 'btn-xploit' : 'btn-ecell'}`}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Booking...' : 'Confirm Team Booking'}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
