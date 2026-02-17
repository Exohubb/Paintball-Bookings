'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function CaptchaPage() {
  const router = useRouter();

  // Auto-skip captcha in development
  const handleContinue = () => {
    router.push('/auth/otp');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-xploit-primary to-ecell-primary bg-clip-text text-transparent">
            Security Check
          </h1>
          <p className="text-gray-400">Click continue to proceed</p>
        </div>

        <motion.button
          onClick={handleContinue}
          className="btn-xploit w-full"
          whileTap={{ scale: 0.95 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
}
