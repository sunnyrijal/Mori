import React, { useState } from 'react';
import { supabase } from '@/services/supabaseClient';

const GoogleLogo = () => (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const AppleLogo = () => (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.22.74 2.98.8 1.14-.23 2.23-.93 3.44-.84 1.47.12 2.58.69 3.3 1.73-3.03 1.82-2.31 5.84.48 6.96-.57 1.56-1.33 3.1-2.2 4.23zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
);

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    console.log("Google button clicked!");
    setLoading(true);
    setErrorMsg(null);
    try {
      console.log("Calling supabase.auth.signInWithOAuth...");
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      console.log("Supabase response:", { data, error });
      if (error) setErrorMsg(error.message);
    } catch (error: any) {
      console.error('Google sign‑in error:', error);
      setErrorMsg(error?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleClick = async () => {
    console.log("Apple button clicked!");
    setLoading(true);
    setErrorMsg(null);
    try {
      console.log("Calling supabase.auth.signInWithOAuth...");
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } });
      console.log("Supabase response:", { data, error });
      if (error) setErrorMsg(error.message);
    } catch (error: any) {
      console.error('Apple sign‑in error:', error);
      setErrorMsg(error?.message || 'Failed to sign in with Apple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ios-bg  px-6 transition-colors duration-300 relative overflow-hidden font-sans">
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8 space-y-3">
            <div className="w-24 h-24 mx-auto flex items-center justify-center">
                <img src="/gozi-mascot.png" alt="Gozi" className="w-20 h-20 object-contain drop-shadow-md" />
            </div>
            <div className="space-y-1">
                <h1 className="text-4xl font-serif italic text-ios-text  tracking-tight">Gozi</h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-ios-muted">AI-powered activity suggestions</p>
            </div>
        </div>
        
        <div className="bg-ios-card  p-8 border border-ios-border  shadow-2xl rounded-[2rem] transition-all duration-500">
          <div className="mb-8 text-center">
             <h2 className="text-2xl font-serif italic text-ios-text  mb-2">Welcome Back</h2>
             <p className="text-xs text-ios-muted tracking-wide leading-relaxed">Tell us what you own, from streaming and gear to hobbies and games, and we'll suggest exactly what to do with your time.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50  border border-red-200  rounded-xl">
              <p className="text-xs text-red-600  text-center font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-3 mb-8">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white  border border-ios-border  rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 :bg-gray-700 transition-all text-sm font-semibold text-gray-700  disabled:opacity-50"
            >
              <GoogleLogo />
              Continue with Google
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleAppleClick}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-black  border border-black  rounded-2xl shadow-sm hover:bg-gray-900 :bg-gray-100 transition-all text-sm font-semibold text-white  disabled:opacity-50"
            >
              <AppleLogo />
              Continue with Apple
            </button>
          </div>
        </div>
        
        <p className="mt-12 text-center text-[9px] font-bold uppercase tracking-[0.4em] text-ios-muted/50">
            Crafted with Intention • 2025
        </p>
      </div>
    </div>
  );
};
