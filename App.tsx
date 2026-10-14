
import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from './hooks/useAppStore';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { TodayScreen } from './screens/TodayScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ChatScreen } from './screens/ChatScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { LandingScreen } from './screens/LandingScreen';
import { HomeIcon, PackageIcon, UserIcon, MessageSquareIcon } from './components/icons/Icons';
import { HobbyDetailModal } from './components/HobbyDetailModal';
import { Mood } from './types';
import { supabase } from './services/supabaseClient';
import { scheduleFridayEveningNudge, scheduleDailyInventoryNudges } from './services/notificationService';
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const MOOD_THEMES: Record<string, { accent: string; overlay: string; darkOverlay: string }> = {
  [Mood.Energized]:  { accent: '#F97316', overlay: 'rgba(249,115,22,0.04)',  darkOverlay: 'rgba(249,115,22,0.07)' },
  [Mood.Focused]:    { accent: '#2563EB', overlay: 'rgba(37,99,235,0.04)',   darkOverlay: 'rgba(37,99,235,0.07)'  },
  [Mood.Creative]:   { accent: '#7C3AED', overlay: 'rgba(124,58,237,0.04)',  darkOverlay: 'rgba(124,58,237,0.07)' },
  [Mood.Tired]:      { accent: '#64748B', overlay: 'rgba(100,116,139,0.04)', darkOverlay: 'rgba(100,116,139,0.07)'},
  [Mood.Anxious]:    { accent: '#059669', overlay: 'rgba(5,150,105,0.04)',   darkOverlay: 'rgba(5,150,105,0.07)'  },
  [Mood.Reflective]: { accent: '#D97706', overlay: 'rgba(217,119,6,0.04)',   darkOverlay: 'rgba(217,119,6,0.07)'  },
  [Mood.Social]:     { accent: '#DB2777', overlay: 'rgba(219,39,119,0.04)',  darkOverlay: 'rgba(219,39,119,0.07)' },
  [Mood.Bored]:      { accent: '#0891B2', overlay: 'rgba(8,145,178,0.04)',   darkOverlay: 'rgba(8,145,178,0.07)'  },
  [Mood.Motivated]:  { accent: '#DC2626', overlay: 'rgba(220,38,38,0.04)',   darkOverlay: 'rgba(220,38,38,0.07)'  },
  [Mood.Balanced]:   { accent: '#000000', overlay: 'rgba(0,0,0,0)',          darkOverlay: 'rgba(0,0,0,0)'          },
};
const DEFAULT_THEME = { accent: '#000000', overlay: 'rgba(0,0,0,0)', darkOverlay: 'rgba(0,0,0,0)' };

function App() {
  const { state, users, actions } = useAppStore();
  const { userProfile, activeScreen, hobbyToDetail, currentMood } = state;
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const theme = useMemo(() => (currentMood ? MOOD_THEMES[currentMood] ?? DEFAULT_THEME : DEFAULT_THEME), [currentMood]);

  // Apply mood accent CSS variable globally so Tailwind's ios-accent picks it up
  useEffect(() => {
    document.documentElement.style.setProperty('--mood-accent', theme.accent);
  }, [theme.accent]);

  useEffect(() => {
    if (activeScreen !== 'Chat' && state.isVoiceSessionActive) {
      actions.endVoiceChat();
    }
  }, [activeScreen, state.isVoiceSessionActive, actions]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      actions.upgradeSubscription('Best');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const addFriendUser = params.get('add_friend');
    if (addFriendUser && userProfile.isLoggedIn) {
      actions.addFriend(addFriendUser);
      alert(`Connected with ${addFriendUser}!`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userProfile.isLoggedIn, actions]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
       Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG }).catch(console.error);
       if (Capacitor.getPlatform() === 'ios') {
           Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_APPLE_KEY || 'paused' }).catch(console.error);
       } else if (Capacitor.getPlatform() === 'android') {
           Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_GOOGLE_KEY || 'paused' }).catch(console.error);
       }
    }

    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session?.user) {
        if (Capacitor.isNativePlatform()) {
            Purchases.logIn({ appUserID: session.user.id }).catch(console.error);
        }
        actions.login(session.user.id);
      }
    }).catch((err: any) => {
      console.error("App: getSession error", err);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        if (Capacitor.isNativePlatform()) {
            Purchases.logIn({ appUserID: session.user.id }).catch(console.error);
        }
        actions.login(session.user.id);
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata.full_name || session.user.email
          })
        }).catch(console.error);
      } else {
        actions.logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile.isLoggedIn && userProfile.preferences?.enableNotifications !== false) {
      scheduleFridayEveningNudge();
      scheduleDailyInventoryNudges(state.inventory);
    }
  }, [userProfile.isLoggedIn, userProfile.preferences?.enableNotifications, state.inventory]);

  if (!userProfile.isLoggedIn) {
    if (showAuth) {
      return <LoginScreen />;
    }
    return <LandingScreen onGetStarted={() => setShowAuth(true)} isLoggedIn={false} />;
  }

  // Hard Paywall
  if (userProfile.subscriptionTier === 'None') {
    return <LandingScreen 
      onGetStarted={() => {
        alert("Choose a plan in the Pricing section below!");
        const el = document.getElementById('pricing');
        if(el) el.scrollIntoView({behavior: 'smooth'});
      }} 
      onSelectPlan={(plan) => actions.upgradeSubscription(plan as any)}
      isLoggedIn={true} 
      onLogout={actions.logout} 
    />;
  }

  if (!userProfile.onboardingCompleted) {
    return <OnboardingScreen username={userProfile.username!} onComplete={actions.addInventoryFromOnboarding} isLoading={state.isLoading} />;
  }

  if (showPrivacy) {
    return <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Today':   return <TodayScreen state={state} actions={actions} />;
      case 'Journey': return <JourneyScreen state={state} actions={actions} />;
      case 'Chat':    return <ChatScreen state={state} actions={actions} />;
      case 'Profile': return <ProfileScreen state={state} users={users} actions={actions} onShowPrivacy={() => setShowPrivacy(true)} />;
      default:        return <TodayScreen state={state} actions={actions} />;
    }
  };

  const isChatScreen = activeScreen === 'Chat';

  return (
    <div className="bg-ios-bg  min-h-screen font-sans text-ios-text  transition-colors duration-500 relative">
      {/* Subtle mood tint overlay — transitions smoothly when mood changes */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-700"
        style={{ background: `linear-gradient(160deg, ${theme.overlay} 0%, transparent 60%)` }}
        aria-hidden
      />

      <main className={`relative z-10 max-w-lg mx-auto ${isChatScreen ? '' : 'px-4 py-6'}`}>
        {renderScreen()}
      </main>

      {hobbyToDetail && (
        <HobbyDetailModal
          isOpen={!!hobbyToDetail}
          onClose={() => actions.setHobbyToDetail(null)}
          onConfirm={actions.addHobbyWithDetails}
          hobby={hobbyToDetail}
          isLoading={state.isLoading}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/85 backdrop-blur-md  border-t border-ios-border  transition-colors duration-300 z-50">
        <div className="flex justify-around h-16">
          <NavButton label="Today"     icon={<HomeIcon strokeWidth={activeScreen === 'Today' ? 3 : 2} />}           isActive={activeScreen === 'Today'}   onClick={() => actions.setActiveScreen('Today')}   />
          <NavButton label="Inventory" icon={<PackageIcon strokeWidth={activeScreen === 'Journey' ? 3 : 2} />}        isActive={activeScreen === 'Journey'} onClick={() => actions.setActiveScreen('Journey')} />
          <NavButton id="nav-chat-btn" label="Chat"      icon={<MessageSquareIcon strokeWidth={activeScreen === 'Chat' ? 3 : 2} />}  isActive={activeScreen === 'Chat'}    onClick={() => actions.setActiveScreen('Chat')}    />
          <NavButton label="Profile"   icon={<UserIcon strokeWidth={activeScreen === 'Profile' ? 3 : 2} />}           isActive={activeScreen === 'Profile'} onClick={() => actions.setActiveScreen('Profile')} />
        </div>
      </nav>
    </div>
  );
}

const NavButton: React.FC<{ id?: string; label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ id, label, icon, isActive, onClick }) => (
  <button
    id={id}
    onClick={async () => {
      await Haptics.impact({ style: ImpactStyle.Light });
      onClick();
    }}
    className={`flex flex-col items-center justify-center w-full text-[9px] uppercase tracking-widest font-bold transition-all duration-200 active:scale-90 ${isActive ? 'text-ios-accent scale-105' : 'text-ios-muted hover:text-ios-accent'}`}
  >
    <div className={`w-5 h-5 mb-0.5 flex items-center justify-center transition-transform ${isActive ? 'scale-110' : ''}`}>{icon}</div>
    {label}
  </button>
);

export default App;
