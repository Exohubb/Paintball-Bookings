'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    grecaptcha: any;
    onCaptchaVerify: (token: string) => void;
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export default function CaptchaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      setError('reCAPTCHA is not configured. Please contact administrator.');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          try {
            window.grecaptcha.render('recaptcha-container', {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: 'onCaptchaVerify',
              theme: 'dark',
            });
          } catch (err) {
            console.error('reCAPTCHA render error:', err);
            setError('Failed to load reCAPTCHA. Please refresh the page.');
          }
        });
      }
    };

    script.onerror = () => {
      setError('Failed to load reCAPTCHA. Please check your internet connection.');
    };

    document.body.appendChild(script);

    window.onCaptchaVerify = async (token: string) => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          router.push('/auth/otp');
        } else {
          setError('Captcha verification failed. Please try again.');
          window.grecaptcha?.reset();
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Network error. Please try again.');
        window.grecaptcha?.reset();
      } finally {
        setLoading(false);
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Check</h1>
          <p className="text-gray-400">Please verify you're human</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="flex justify-center mb-6">
          <div id="recaptcha-container"></div>
        </div>

        {loading && (
          <div className="text-center text-gray-400 text-sm">
            Verifying...
          </div>
        )}
      </motion.div>
    </div>
  );
}
