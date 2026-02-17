'use client';

import { motion } from 'framer-motion';
import type { TeamBooking } from '@/types';

interface Props {
  teamBooking: TeamBooking;
  onClose: () => void;
}

export default function TeamDetailsModal({ teamBooking, onClose }: Props) {
  const members = teamBooking.team_members || [];
  const leader = members.find(m => m.is_leader);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel p-6 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-2">{teamBooking.team_name}</h2>
        <div className="text-sm text-gray-400 mb-6">Team Details</div>

        <div className="space-y-3 mb-6">
          {leader && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-yellow-400 text-xs font-bold">👑 LEADER</div>
                <div className={`text-xs px-2 py-0.5 rounded ${leader.gender === 'female' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {leader.gender === 'female' ? 'Female' : 'Male'}
                </div>
              </div>
              <div className="font-semibold">{leader.name}</div>
            </div>
          )}

          {members.filter(m => !m.is_leader).map((member, index) => (
            <div key={member.id} className="bg-white/5 border border-white/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-gray-400 text-xs">Member {index + 2}</div>
                <div className={`text-xs px-2 py-0.5 rounded ${member.gender === 'female' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {member.gender === 'female' ? 'Female' : 'Male'}
                </div>
              </div>
              <div className="font-semibold">{member.name}</div>
            </div>
          ))}
        </div>

        <motion.button
          onClick={onClose}
          className="btn-primary bg-white/10 w-full"
          whileTap={{ scale: 0.95 }}
        >
          Close
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
