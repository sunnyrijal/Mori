
import React, { useState } from 'react';
import { OnboardingData } from '@/types';
import { LoaderIcon } from '@/components/icons/Icons';
import { DIGITAL_APPS_LIST } from '@/constants';
import { geminiService } from '@/services/geminiService';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface OnboardingScreenProps {
  username: string;
  onComplete: (data: OnboardingData) => void;
  isLoading: boolean;
}

const STEP_LABELS = ["Welcome", "Hobbies", "Gaming", "Games", "Streaming", "Goals", "Digital Apps", "Inventory", "Subscription"];
const TOTAL_VISIBLE_STEPS = 8;
const platformsRequiringInput = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile Games", "Other"];

const GAMING_OPTIONS = [
  { id: "PC", label: "PC", description: "Home setups & beyond", icon: "💻" },
  { id: "PlayStation", label: "PlayStation", description: "Sony's flagship console", icon: "🎮" },
  { id: "Xbox", label: "Xbox", description: "Game Pass & more", icon: "🕹️" },
  { id: "Nintendo Switch", label: "Nintendo Switch", description: "Play anywhere", icon: "🟥" },
  { id: "Mobile Games", label: "Mobile Games", description: "Tap & swipe", icon: "📱" },
  { id: "Board Games", label: "Board Games", description: "Analog competition", icon: "♟️" },
  { id: "Other", label: "Other", description: "My own platforms", icon: "✦" },
];

const STREAMING_OPTIONS = [
  { id: "Netflix", label: "Netflix", description: "Films, series & originals", icon: "🎬" },
  { id: "Hulu", label: "Hulu", description: "Live TV + on demand", icon: "📺" },
  { id: "Disney+", label: "Disney+", description: "Marvel, Star Wars & more", icon: "✨" },
  { id: "YouTube", label: "YouTube", description: "Creators & everything else", icon: "▶️" },
  { id: "Max", label: "Max", description: "HBO & Warner originals", icon: "🎭" },
  { id: "Prime Video", label: "Prime Video", description: "Amazon's streaming hub", icon: "📦" },
  { id: "Apple TV+", label: "Apple TV+", description: "Premium originals", icon: "🍎" },
  { id: "Other", label: "Other", description: "Something else I love", icon: "✦" },
];

const GOALS_OPTIONS = [
  { id: "Get more active", label: "Get more active", description: "Exercise, movement, outdoor", icon: "🏃" },
  { id: "Learn something new", label: "Learn something new", description: "Skills, languages, knowledge", icon: "🧠" },
  { id: "Be more creative", label: "Be more creative", description: "Art, music, writing, making", icon: "🎨" },
  { id: "Relax & recharge", label: "Relax & recharge", description: "Rest, calm, recovery", icon: "🧘" },
  { id: "Cook & eat well", label: "Cook & eat well", description: "Recipes, food, nourishment", icon: "🍳" },
  { id: "Quality time with others", label: "Quality time with others", description: "Friends, family, connection", icon: "👥" },
  { id: "Explore my world", label: "Explore my world", description: "Local spots, nature, discovery", icon: "🌍" },
  { id: "Build better habits", label: "Build better habits", description: "Routines, consistency, health", icon: "💪" },
  { id: "Dive into music", label: "Dive into music", description: "Listen, play, discover", icon: "🎵" },
  { id: "Read & reflect more", label: "Read & reflect more", description: "Books, writing, deep thinking", icon: "📖" },
  { id: "More fun & entertainment", label: "More fun & entertainment", description: "Games, shows, laughter", icon: "🎮" },
  { id: "Find more balance", label: "Find more balance", description: "Simplicity, mindfulness, peace", icon: "🌿" },
];

const HOBBY_TAGS = [
  "Reading", "Hiking", "Photography", "Cooking", "Fitness", "Yoga",
  "Drawing", "Music", "Travel", "Gardening", "Gaming", "Writing",
  "Cycling", "Meditation", "Crafts", "Dancing", "Film", "Podcasts",
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ username, onComplete, isLoading }) => {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [data, setData] = useState<OnboardingData>({
    hobbies: [], games: [], streaming: [], goals: [], inventoryText: '', gameListText: '', digitalApps: []
  });
  const [customGamePlatform, setCustomGamePlatform] = useState("");
  const [customStreamingPlatform, setCustomStreamingPlatform] = useState("");

  const goNext = () => {
    setDirection('forward');
    setIsAnimating(true);
    setTimeout(() => {
      setStep(s => {
        let next = s + 1;
        if (s === 2 && !data.games.some(g => platformsRequiringInput.includes(g))) next++;
        return Math.min(next, STEP_LABELS.length - 1);
      });
      setIsAnimating(false);
    }, 250);
  };

  const goBack = () => {
    setDirection('back');
    setIsAnimating(true);
    setTimeout(() => {
      setStep(s => {
        let prev = s - 1;
        if (s === 4 && !data.games.some(g => platformsRequiringInput.includes(g))) prev--;
        return Math.max(prev, 0);
      });
      setIsAnimating(false);
    }, 250);
  };

  const updateData = (patch: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...patch }));

  const renderStep = () => {
    switch (step) {
      case 0: return <WelcomeStep username={username} onNext={goNext} />;
      case 1: return <HobbiesStep stepNum={1} totalSteps={TOTAL_VISIBLE_STEPS} data={data} updateData={updateData} onNext={goNext} onBack={goBack} />;
      case 2: return <ListSelectStep stepNum={2} totalSteps={TOTAL_VISIBLE_STEPS} title="Where do you play?" subtitle="Gaming platforms" options={GAMING_OPTIONS} selected={data.games} onToggle={id => { const next = data.games.includes(id) ? data.games.filter(g => g !== id) : [...data.games, id]; updateData({ games: next }); }} onNext={goNext} onBack={goBack} allowCustom customValue={customGamePlatform} setCustomValue={setCustomGamePlatform} />;
      case 3: return <GameDetailStep stepNum={3} totalSteps={TOTAL_VISIBLE_STEPS} data={data} setData={setData} onNext={goNext} onBack={goBack} />;
      case 4: return <ListSelectStep stepNum={step === 4 && !data.games.some(g => platformsRequiringInput.includes(g)) ? 3 : 4} totalSteps={TOTAL_VISIBLE_STEPS} title="Streaming & Content" subtitle="" options={STREAMING_OPTIONS} selected={data.streaming} onToggle={id => { const next = data.streaming.includes(id) ? data.streaming.filter(s => s !== id) : [...data.streaming, id]; updateData({ streaming: next }); }} onNext={goNext} onBack={goBack} allowCustom customValue={customStreamingPlatform} setCustomValue={setCustomStreamingPlatform} />;
      case 5: return <ListSelectStep stepNum={step === 5 && !data.games.some(g => platformsRequiringInput.includes(g)) ? 4 : 5} totalSteps={TOTAL_VISIBLE_STEPS} title="What are you working towards?" subtitle="Your current goals" options={GOALS_OPTIONS} selected={data.goals} onToggle={id => { const next = data.goals.includes(id) ? data.goals.filter(g => g !== id) : [...data.goals, id]; updateData({ goals: next }); }} onNext={goNext} onBack={goBack} showScrollIndicator />;
      case 6: return <DigitalAppsStep stepNum={step === 6 && !data.games.some(g => platformsRequiringInput.includes(g)) ? 5 : 6} totalSteps={TOTAL_VISIBLE_STEPS} data={data} updateData={updateData} onNext={goNext} onBack={goBack} />;
      case 7: return <InventoryStep data={data} updateData={updateData} onComplete={goNext} onBack={goBack} isLoading={false} />;
      case 8: return <SubscriptionStep onNext={() => {
        const finalGames = data.games.map(g => g === 'Other' && customGamePlatform.trim() ? customGamePlatform.trim() : g).filter(g => g !== 'Other' || customGamePlatform.trim() !== '');
        const finalStreaming = data.streaming.map(s => s === 'Other' && customStreamingPlatform.trim() ? customStreamingPlatform.trim() : s).filter(s => s !== 'Other' || customStreamingPlatform.trim() !== '');
        onComplete({ ...data, games: finalGames, streaming: finalStreaming });
      }} isLoading={isLoading} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full font-sans" style={{ background: '#F7F4EF' }}>
      <div
        className={`transition-all duration-250 ease-in-out ${isAnimating ? (direction === 'forward' ? '-translate-x-4 opacity-0' : 'translate-x-4 opacity-0') : 'translate-x-0 opacity-100'}`}
      >
        {renderStep()}
      </div>
    </div>
  );
};

// ─── Shared Layout Shell ─────────────────────────────────────────────────────

const Shell: React.FC<{
  stepNum?: number;
  totalSteps?: number;
  onBack?: () => void;
  onSkip?: () => void;
  children: React.ReactNode;
}> = ({ stepNum, totalSteps, onBack, onSkip, children }) => (
  <div className="min-h-screen flex flex-col max-w-lg mx-auto px-6 pb-10">
    {/* Top bar */}
    <div className="flex items-center justify-between pt-14 pb-8">
      {onBack ? (
        <button onClick={onBack} className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580] hover:text-[#1A1815] transition-colors">← Back</button>
      ) : <div />}
      {stepNum !== undefined && totalSteps !== undefined && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580]">Step {stepNum} of {totalSteps}</span>
      )}
      {onSkip ? (
        <button onClick={onSkip} className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580] hover:text-[#1A1815] transition-colors">Skip</button>
      ) : <div />}
    </div>
    <div className="flex-1 flex flex-col">{children}</div>
  </div>
);

// ─── Buttons ──────────────────────────────────────────────────────────────────

const PrimaryBtn: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string }> = ({ onClick, disabled, children, className = '' }) => (
  <button
    onClick={async () => {
      await Haptics.impact({ style: ImpactStyle.Medium });
      onClick();
    }}
    disabled={disabled}
    className={`w-full py-4 px-8 bg-[#1A1815] text-white font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#2D2A26] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
  >
    {children}
  </button>
);

const SageBtn: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={async () => {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      onClick();
    }}
    className="w-full py-4 px-8 bg-[#4A7B5C] text-white font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#3D6A4E] active:scale-[0.98] transition-all"
  >
    {children}
  </button>
);

const GhostBtn: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={async () => {
      await Haptics.impact({ style: ImpactStyle.Light });
      onClick();
    }}
    className="w-full py-4 px-8 bg-white border border-[#E4E0D8] text-[#1A1815] font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#F7F4EF] active:scale-[0.98] transition-all"
  >
    {children}
  </button>
);

// ─── Grid Option Card ─────────────────────────────────────────────────────────

const OptionCard: React.FC<{ icon: string; label: string; description: string; selected: boolean; onToggle: () => void }> = ({ icon, label, description, selected, onToggle }) => (
  <button
    onClick={async () => {
      await Haptics.impact({ style: ImpactStyle.Light });
      onToggle();
    }}
    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all duration-200 text-left w-full active:scale-[0.97] ${selected ? 'bg-white border-[#1A1815] shadow-md ring-1 ring-[#1A1815]' : 'bg-white border-[#E4E0D8] hover:border-[#C8C4BC]'}`}
  >
    <div className="flex items-center justify-between w-full">
      <span className="text-2xl transition-transform duration-200" style={{ transform: selected ? 'scale(1.1)' : 'scale(1)' }}>{icon}</span>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${selected ? 'bg-[#4A7B5C] border-[#4A7B5C] scale-110' : 'border-[#C8C4BC]'}`}>
        {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
    </div>
    <div className="mt-1">
      <p className="text-sm font-semibold text-[#1A1815] leading-tight">{label}</p>
      <p className="text-[9px] text-[#8A8580] mt-1 uppercase tracking-wide leading-tight">{description}</p>
    </div>
  </button>
);

// ─── Steps ────────────────────────────────────────────────────────────────────

const WelcomeStep: React.FC<{ username: string; onNext: () => void }> = ({ username, onNext }) => {
  const [askingLocation, setAskingLocation] = useState(false);

  const handleStart = () => {
    setAskingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Onboarding location permission granted", position);
          setAskingLocation(false);
          onNext();
        },
        (error) => {
          console.warn("Onboarding location permission denied or error", error);
          setAskingLocation(false);
          onNext();
        },
        { timeout: 6000 }
      );
    } else {
      setAskingLocation(false);
      onNext();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between max-w-lg mx-auto px-6 py-14">
      <div className="w-full space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8A8580]">✦ Welcome home</p>
        <h1 className="text-5xl font-serif italic text-[#1A1815] leading-tight">
          Hello,<br />
          <span>{username}.</span>
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2">
        <img
          src="/gozi-mascot.png"
          alt="Gozi mascot"
          className="w-44 h-44 object-cover drop-shadow-md"
        />
        <p className="text-xs text-[#8A8580] font-medium tracking-wide">Gozi</p>
      </div>

      <div className="w-full space-y-5">
        <div className="bg-white rounded-3xl p-6 border border-[#E4E0D8] shadow-sm">
          <p className="text-[#6B6560] text-sm leading-relaxed mb-4 font-medium">
            Let's make this app truly yours. I'll learn what you love, what you own, and how you feel—so I can suggest the perfect thing to do right now, every time.
          </p>
          <p className="text-[#8A8580] text-[11px] leading-relaxed mb-5 border-t border-[#E4E0D8]/60 pt-4 flex items-start gap-2">
            <span className="text-lg">📍</span> 
            <span>Gozi uses your location to discover spontaneous nearby walks, hidden gems, and events. We will request location permission to show you local magic.</span>
          </p>
          <PrimaryBtn onClick={handleStart} disabled={askingLocation}>
            {askingLocation ? (
              <span className="flex items-center justify-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" /> Enabling location...
              </span>
            ) : "Let's get started →"}
          </PrimaryBtn>
        </div>
        <blockquote className="text-center text-[10px] font-medium uppercase tracking-widest text-[#8A8580] italic">
          "Every journey begins with a single, intentional step."
        </blockquote>
      </div>
    </div>
  );
};

const ListSelectStep: React.FC<{
  stepNum: number; totalSteps: number; title: string; subtitle: string;
  options: { id: string; label: string; description: string; icon: string }[];
  selected: string[]; onToggle: (id: string) => void;
  onNext: () => void; onBack: () => void;
  showScrollIndicator?: boolean;
  allowCustom?: boolean;
  customValue?: string;
  setCustomValue?: (val: string) => void;
}> = ({ stepNum, totalSteps, title, subtitle, options, selected, onToggle, onNext, onBack, showScrollIndicator, allowCustom, customValue, setCustomValue }) => (
  <Shell stepNum={stepNum} totalSteps={totalSteps} onBack={onBack} onSkip={onNext}>
    <div className="mb-6">
      {subtitle && <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">{subtitle}</p>}
      <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">{title}</h2>
    </div>

    <div className="flex-1 pb-6 relative">
      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => (
          <OptionCard key={opt.id} icon={opt.icon} label={opt.label} description={opt.description} selected={selected.includes(opt.id)} onToggle={() => onToggle(opt.id)} />
        ))}
      </div>
      {allowCustom && selected.includes('Other') && setCustomValue && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
          <input 
            type="text" 
            placeholder="Type your own..." 
            value={customValue || ''}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-full bg-white border border-[#E4E0D8] focus:border-[#1A1815] px-4 py-3 rounded-2xl text-sm text-[#1A1815] placeholder-[#C8C4BC] focus:outline-none transition-all"
            autoFocus
          />
        </div>
      )}
      {showScrollIndicator && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-40 animate-pulse pointer-events-none">
          <div className="w-1 h-8 bg-[#C8C4BC] rounded-full" />
          <svg className="w-4 h-4 text-[#8A8580]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      )}
    </div>

    <div className="pt-2 space-y-3">
      <PrimaryBtn onClick={onNext}>Continue →</PrimaryBtn>
      {selected.length > 0 && (
        <p className="text-center text-[10px] text-[#8A8580] font-medium">{selected.length} selected</p>
      )}
    </div>
  </Shell>
);

const GameDetailStep: React.FC<{ stepNum: number; totalSteps: number; data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>>; onNext: () => void; onBack: () => void }> = ({ stepNum, totalSteps, data, setData, onNext, onBack }) => {
  const platforms = data.games.filter(g => platformsRequiringInput.includes(g));
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const handleNext = () => {
    const gameList = Object.entries(inputs).filter(([, v]) => v.trim()).map(([p, t]) => `${p}: ${t}`).join('. ');
    setData(prev => ({ ...prev, gameListText: gameList }));
    onNext();
  };

  return (
    <Shell stepNum={stepNum} totalSteps={totalSteps} onBack={onBack} onSkip={handleNext}>
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">Gaming library</p>
        <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">What are you<br />playing?</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pb-6 no-scrollbar">
        {platforms.map(platform => (
          <div key={platform} className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580] ml-1">{platform} Favourites</label>
            <input
              type="text"
              value={inputs[platform] || ''}
              onChange={e => setInputs(prev => ({ ...prev, [platform]: e.target.value }))}
              placeholder="e.g. Elden Ring, Baldur's Gate 3…"
              className="w-full bg-white border border-[#E4E0D8] focus:border-[#1A1815] px-5 py-4 rounded-2xl text-sm text-[#1A1815] placeholder-[#C8C4BC] focus:outline-none transition-all"
            />
          </div>
        ))}
      </div>

      <div className="pt-4">
        <PrimaryBtn onClick={handleNext}>Continue →</PrimaryBtn>
      </div>
    </Shell>
  );
};

const HobbiesStep: React.FC<{ stepNum: number; totalSteps: number; data: OnboardingData; updateData: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }> = ({ stepNum, totalSteps, data, updateData, onNext, onBack }) => {
  const [custom, setCustom] = useState('');

  const toggleTag = (tag: string) => {
    const next = data.hobbies.includes(tag) ? data.hobbies.filter(h => h !== tag) : [...data.hobbies, tag];
    updateData({ hobbies: next });
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !data.hobbies.includes(trimmed)) {
      updateData({ hobbies: [...data.hobbies, trimmed] });
    }
    setCustom('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustom(); }
  };

  return (
    <Shell stepNum={stepNum} totalSteps={totalSteps} onBack={onBack} onSkip={onNext}>
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">Personal passions</p>
        <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">What brings<br />you joy?</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 no-scrollbar">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580] mb-4">Select all that apply</p>
        <div className="flex flex-wrap gap-2.5 mb-6">
          {HOBBY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={async () => {
                await Haptics.impact({ style: ImpactStyle.Light });
                toggleTag(tag);
              }}
              className={`px-4 py-2 rounded-full border text-[11px] font-semibold tracking-wide transition-all active:scale-[0.95] ${data.hobbies.includes(tag) ? 'bg-[#1A1815] border-[#1A1815] text-white shadow-sm' : 'bg-white border-[#E4E0D8] text-[#1A1815] hover:border-[#8A8580]'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580] mb-3">Add your own</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={handleKey}
            placeholder="e.g. Bouldering, Journaling…"
            className="flex-1 bg-white border border-[#E4E0D8] focus:border-[#1A1815] px-4 py-3 rounded-2xl text-sm text-[#1A1815] placeholder-[#C8C4BC] focus:outline-none transition-all"
          />
          <button onClick={addCustom} className="px-4 py-3 bg-[#1A1815] text-white rounded-2xl text-sm font-bold hover:bg-[#2D2A26] transition-all">+</button>
        </div>

        {data.hobbies.filter(h => !HOBBY_TAGS.includes(h)).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.hobbies.filter(h => !HOBBY_TAGS.includes(h)).map(h => (
              <span key={h} className="px-4 py-2 rounded-full bg-[#4A7B5C] text-white text-[11px] font-semibold flex items-center gap-1.5">
                {h}
                <button onClick={() => toggleTag(h)} className="opacity-70 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 space-y-3">
        <PrimaryBtn onClick={onNext}>Continue →</PrimaryBtn>
        {data.hobbies.length > 0 && (
          <p className="text-center text-[10px] text-[#8A8580] font-medium">{data.hobbies.length} interests added</p>
        )}
      </div>
    </Shell>
  );
};

const DigitalAppsStep: React.FC<{ stepNum: number; totalSteps: number; data: OnboardingData; updateData: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }> = ({ stepNum, totalSteps, data, updateData, onNext, onBack }) => {
  const [customApp, setCustomApp] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const addCustomApp = () => {
    if (customApp.trim() && !data.digitalApps.includes(customApp.trim())) {
      updateData({ digitalApps: [...data.digitalApps, customApp.trim()] });
    }
    setCustomApp('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addCustomApp();
  };

  const toggleApp = (app: string) => {
    updateData({
      digitalApps: data.digitalApps.includes(app)
        ? data.digitalApps.filter(a => a !== app)
        : [...data.digitalApps, app]
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result?.toString().split(',')[1];
      if (base64Data) {
        const parsedApps = await geminiService.parseHomescreenScreenshot(base64Data, file.type);
        if (parsedApps.length === 0) {
            alert("Gozi couldn't detect any apps, or the image format wasn't supported. Please try again or add them manually.");
        } else {
            const newApps = parsedApps.filter(app => !data.digitalApps.includes(app));
            updateData({ digitalApps: [...data.digitalApps, ...newApps] });
        }
      }
      setIsParsing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Shell stepNum={stepNum} totalSteps={totalSteps} onBack={onBack} onSkip={onNext}>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">Digital Inventory</p>
        <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">Apps on your<br />phone</h2>
        <p className="text-[#6B6560] text-sm leading-relaxed mt-4">
          This helps Gozi suggest using your favorite tools for activities. 
        </p>
      </div>

      <div className="flex-1 space-y-6">
        <div className={`bg-white border border-[#E4E0D8] rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all ${isParsing ? 'bg-gray-50 opacity-80' : ''}`}>
          <div className="w-12 h-12 bg-[#F7F4EF] rounded-full flex items-center justify-center text-xl mb-1">📸</div>
          <div>
            <p className="text-sm font-semibold text-[#1A1815]">Upload Screenshot</p>
            <p className="text-[10px] text-[#8A8580] uppercase tracking-wide mt-1">Let Gozi detect them magically</p>
          </div>
          <label className={`mt-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isParsing ? 'bg-[#E4E0D8] text-[#8A8580] cursor-wait' : 'bg-[#1A1815] text-white cursor-pointer hover:bg-[#2D2A26] active:scale-95'}`}>
            {isParsing ? "Analyzing image..." : "Select Image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isParsing} />
          </label>
          {isParsing && (
            <div className="w-full mt-2 space-y-2">
              <div className="h-1.5 w-full bg-[#E4E0D8] rounded-full overflow-hidden">
                <div className="h-full bg-[#1A1815] rounded-full w-1/2 animate-[progress_1s_ease-in-out_infinite]" />
              </div>
              <p className="text-[9px] text-[#8A8580] uppercase tracking-widest animate-pulse">Gozi is looking closely...</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580] mb-3">Popular Apps</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {DIGITAL_APPS_LIST.slice(0, 5).map(app => (
              <button
                key={app.id}
                onClick={async () => {
                  await Haptics.impact({ style: ImpactStyle.Light });
                  toggleApp(app.name);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 ${data.digitalApps.includes(app.name) ? 'bg-[#4A7B5C] border-[#4A7B5C] text-white' : 'bg-white border-[#E4E0D8] text-[#8A8580] hover:border-[#1A1815]'}`}
              >
                {app.name}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8580] mb-3">Add manually</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customApp}
              onChange={e => setCustomApp(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. Day One, Strava, Notion…"
              className="flex-1 bg-white border border-[#E4E0D8] focus:border-[#1A1815] px-4 py-3 rounded-2xl text-sm text-[#1A1815] placeholder-[#C8C4BC] focus:outline-none transition-all"
            />
            <button onClick={addCustomApp} className="px-4 py-3 bg-[#1A1815] text-white rounded-2xl text-sm font-bold hover:bg-[#2D2A26] transition-all">+</button>
          </div>
        </div>

        {data.digitalApps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.digitalApps.map(app => (
              <span key={app} className="px-4 py-2 rounded-full bg-[#4A7B5C] text-white text-[11px] font-semibold flex items-center gap-1.5">
                {app}
                <button onClick={() => toggleApp(app)} className="opacity-70 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4">
        <PrimaryBtn onClick={onNext}>Continue →</PrimaryBtn>
      </div>
    </Shell>
  );
};




const InventoryStep: React.FC<{ data: OnboardingData; updateData: (p: Partial<OnboardingData>) => void; onComplete: () => void; onBack: () => void; isLoading: boolean }> = ({ data, updateData, onComplete, onBack, isLoading }) => (
  <Shell stepNum={6} totalSteps={TOTAL_VISIBLE_STEPS} onBack={onBack}>
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">Finishing touches</p>
      <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">Describe<br />your space.</h2>
    </div>

    <div className="flex-1 pb-6">
      <p className="text-sm text-[#6B6560] leading-relaxed mb-5">
        Tell us anything else about your world: gadgets, instruments, pets, equipment, memberships, or subscriptions. The more you share, the more personal your suggestions become.
      </p>
      <textarea
        value={data.inventoryText}
        onChange={e => updateData({ inventoryText: e.target.value })}
        className="w-full h-44 bg-white border border-[#E4E0D8] focus:border-[#1A1815] px-5 py-4 rounded-2xl text-sm text-[#1A1815] placeholder-[#C8C4BC] focus:outline-none transition-all resize-none leading-relaxed"
        placeholder="A guitar, Costco membership, DSLR camera, art supplies, camping gear…"
      />
      <div className="mt-5 bg-[#EBF2ED] rounded-2xl p-4 border border-[#C8DDD0]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A7B5C] mb-1">✦ Why this matters</p>
        <p className="text-xs text-[#4A7B5C] leading-relaxed">Your inventory helps us suggest activities that are actually possible with what you own, not generic ideas, but things tailored specifically to your life.</p>
      </div>
    </div>

    <div className="pt-4">
      <PrimaryBtn onClick={onComplete}>
        Continue →
      </PrimaryBtn>
    </div>
  </Shell>
);

const SubscriptionStep: React.FC<{ onNext: () => void; isLoading?: boolean }> = ({ onNext, isLoading }) => (
  <Shell stepNum={8} totalSteps={TOTAL_VISIBLE_STEPS} hideNav>
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">Choose your path</p>
      <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">Elevate your<br />experience.</h2>
    </div>

    <div className="flex-1 space-y-4">
      {/* Free tier */}
      <div className="bg-white rounded-3xl border border-[#E4E0D8] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-sm text-[#1A1815]">Free</p>
            <p className="text-[10px] text-[#8A8580] uppercase tracking-widest">Always included</p>
          </div>
          <span className="text-xl">🌱</span>
        </div>
        <ul className="space-y-2">
          {["3 suggestion refreshes per day", "Mood-based activity ideas", "Daily knowledge question", "Inventory up to 20 items"].map(f => (
            <li key={f} className="flex items-start gap-2.5 text-xs text-[#6B6560]">
              <span className="text-[#4A7B5C] font-bold mt-0.5">✓</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Premium tier */}
      <div className="bg-[#1A1815] rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center justify-between mb-4 relative">
          <div>
            <p className="font-bold text-sm text-white">Premium</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">$4.99 / month</p>
          </div>
          <span className="text-xl">✨</span>
        </div>
        <ul className="space-y-2 relative">
          {[
            "Unlimited suggestion refreshes",
            "Music picks matched to your mood",
            "Local activity discovery",
            "AI companion chat",
            "Partner & friends sync",
            "Weekly AI check-in on what you've used",
          ].map(f => (
            <li key={f} className="flex items-start gap-2.5 text-xs text-white/80">
              <span className="text-[#7EC89A] font-bold mt-0.5">✓</span> {f}
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="pt-4 space-y-3">
      <SageBtn onClick={onNext}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoaderIcon className="w-4 h-4 animate-spin" /> Setting up...
          </span>
        ) : "Upgrade to Premium →"}
      </SageBtn>
      <GhostBtn onClick={onNext}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoaderIcon className="w-4 h-4 animate-spin" /> Setting up...
          </span>
        ) : "Continue for Free"}
      </GhostBtn>
      <p className="text-center text-[10px] text-[#8A8580]">You can upgrade anytime from your profile.</p>
    </div>
  </Shell>
);
