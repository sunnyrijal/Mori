
import React, { useState } from 'react';
import { OnboardingData } from '@/types';
import { LoaderIcon } from '@/components/icons/Icons';

interface OnboardingScreenProps {
  username: string;
  onComplete: (data: OnboardingData) => void;
  isLoading: boolean;
}

const STEP_LABELS = ["Welcome", "Gaming", "Games", "Streaming", "Goals", "Hobbies", "Premium", "Inventory"];
const TOTAL_VISIBLE_STEPS = 7;
const platformsRequiringInput = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile Games"];

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
    streaming: [], games: [], gameListText: '', goals: [], hobbies: [], inventoryText: ''
  });

  const goNext = () => {
    setDirection('forward');
    setIsAnimating(true);
    setTimeout(() => {
      setStep(s => {
        let next = s + 1;
        if (s === 1 && !data.games.some(g => platformsRequiringInput.includes(g))) next++;
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
        if (s === 3 && !data.games.some(g => platformsRequiringInput.includes(g))) prev--;
        return Math.max(prev, 0);
      });
      setIsAnimating(false);
    }, 250);
  };

  const updateData = (patch: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...patch }));

  const renderStep = () => {
    switch (step) {
      case 0: return <WelcomeStep username={username} onNext={goNext} />;
      case 1: return <ListSelectStep stepNum={1} totalSteps={TOTAL_VISIBLE_STEPS} title="Where do you play?" subtitle="Gaming platforms" options={GAMING_OPTIONS} selected={data.games} onToggle={id => { const next = data.games.includes(id) ? data.games.filter(g => g !== id) : [...data.games, id]; updateData({ games: next }); }} onNext={goNext} onBack={goBack} />;
      case 2: return <GameDetailStep stepNum={2} totalSteps={TOTAL_VISIBLE_STEPS} data={data} setData={setData} onNext={goNext} onBack={goBack} />;
      case 3: return <ListSelectStep stepNum={step === 3 && !data.games.some(g => platformsRequiringInput.includes(g)) ? 2 : 3} totalSteps={TOTAL_VISIBLE_STEPS} title="What moves you?" subtitle="Streaming & content" options={STREAMING_OPTIONS} selected={data.streaming} onToggle={id => { const next = data.streaming.includes(id) ? data.streaming.filter(s => s !== id) : [...data.streaming, id]; updateData({ streaming: next }); }} onNext={goNext} onBack={goBack} />;
      case 4: return <ListSelectStep stepNum={4} totalSteps={TOTAL_VISIBLE_STEPS} title="What are you working towards?" subtitle="Your current goals" options={GOALS_OPTIONS} selected={data.goals} onToggle={id => { const next = data.goals.includes(id) ? data.goals.filter(g => g !== id) : [...data.goals, id]; updateData({ goals: next }); }} onNext={goNext} onBack={goBack} />;
      case 5: return <HobbiesStep stepNum={5} totalSteps={TOTAL_VISIBLE_STEPS} data={data} updateData={updateData} onNext={goNext} onBack={goBack} />;
      case 6: return <PaywallStep onNext={goNext} onBack={goBack} />;
      case 7: return <InventoryStep data={data} updateData={updateData} onComplete={() => onComplete(data)} onBack={goBack} isLoading={isLoading} />;
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
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-4 px-8 bg-[#1A1815] text-white font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#2D2A26] transition-all disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const SageBtn: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full py-4 px-8 bg-[#4A7B5C] text-white font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#3D6A4E] transition-all"
  >
    {children}
  </button>
);

const GhostBtn: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full py-4 px-8 bg-white border border-[#E4E0D8] text-[#1A1815] font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#F7F4EF] transition-all"
  >
    {children}
  </button>
);

// ─── Grid Option Card ─────────────────────────────────────────────────────────

const OptionCard: React.FC<{ icon: string; label: string; description: string; selected: boolean; onToggle: () => void }> = ({ icon, label, description, selected, onToggle }) => (
  <button
    onClick={onToggle}
    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all duration-200 text-left w-full ${selected ? 'bg-white border-[#1A1815] shadow-sm' : 'bg-white border-[#E4E0D8] hover:border-[#C8C4BC]'}`}
  >
    <div className="flex items-center justify-between w-full">
      <span className="text-2xl">{icon}</span>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-[#4A7B5C] border-[#4A7B5C]' : 'border-[#C8C4BC]'}`}>
        {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
    </div>
    <div>
      <p className="text-sm font-semibold text-[#1A1815] leading-tight">{label}</p>
      <p className="text-[9px] text-[#8A8580] mt-0.5 uppercase tracking-wide leading-tight">{description}</p>
    </div>
  </button>
);

// ─── Steps ────────────────────────────────────────────────────────────────────

const WelcomeStep: React.FC<{ username: string; onNext: () => void }> = ({ username, onNext }) => (
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
        src="/logo.svg"
        alt="Life Companion mascot"
        className="w-44 h-44 object-contain drop-shadow-md"
      />
      <p className="text-xs text-[#8A8580] font-medium tracking-wide">Your Life Companion</p>
    </div>

    <div className="w-full space-y-5">
      <div className="bg-white rounded-3xl p-6 border border-[#E4E0D8] shadow-sm">
        <p className="text-[#6B6560] text-sm leading-relaxed mb-5">
          I'll learn what you own, what you love, and how you're feeling — then suggest exactly what to do with your time, every single day.
        </p>
        <PrimaryBtn onClick={onNext}>Let's get started →</PrimaryBtn>
      </div>
      <blockquote className="text-center text-[10px] font-medium uppercase tracking-widest text-[#8A8580] italic">
        "Every journey begins with a single, intentional step."
      </blockquote>
    </div>
  </div>
);

const ListSelectStep: React.FC<{
  stepNum: number; totalSteps: number; title: string; subtitle: string;
  options: { id: string; label: string; description: string; icon: string }[];
  selected: string[]; onToggle: (id: string) => void;
  onNext: () => void; onBack: () => void;
}> = ({ stepNum, totalSteps, title, subtitle, options, selected, onToggle, onNext, onBack }) => (
  <Shell stepNum={stepNum} totalSteps={totalSteps} onBack={onBack} onSkip={onNext}>
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">{subtitle}</p>
      <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">{title}</h2>
    </div>

    <div className="flex-1 pb-6">
      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => (
          <OptionCard key={opt.id} icon={opt.icon} label={opt.label} description={opt.description} selected={selected.includes(opt.id)} onToggle={() => onToggle(opt.id)} />
        ))}
      </div>
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
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full border text-[11px] font-semibold tracking-wide transition-all ${data.hobbies.includes(tag) ? 'bg-[#1A1815] border-[#1A1815] text-white' : 'bg-white border-[#E4E0D8] text-[#1A1815] hover:border-[#8A8580]'}`}
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

const PaywallStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => (
  <Shell onBack={onBack}>
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">Before you begin</p>
      <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">The heart of<br />your space.</h2>
    </div>

    <div className="flex-1 space-y-4 pb-6">
      <p className="text-sm text-[#6B6560] leading-relaxed">
        Like the best apps you use every day, Life Companion offers a free experience — and a deeper one for those who want it.
      </p>

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
      <SageBtn onClick={onNext}>Upgrade to Premium →</SageBtn>
      <GhostBtn onClick={onNext}>Continue for Free</GhostBtn>
      <p className="text-center text-[10px] text-[#8A8580]">You can upgrade anytime from your profile.</p>
    </div>
  </Shell>
);

const InventoryStep: React.FC<{ data: OnboardingData; updateData: (p: Partial<OnboardingData>) => void; onComplete: () => void; onBack: () => void; isLoading: boolean }> = ({ data, updateData, onComplete, onBack, isLoading }) => (
  <Shell stepNum={7} totalSteps={TOTAL_VISIBLE_STEPS} onBack={onBack}>
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8580] mb-2">Finishing touches</p>
      <h2 className="text-4xl font-serif italic text-[#1A1815] leading-tight">Describe<br />your space.</h2>
    </div>

    <div className="flex-1 pb-6">
      <p className="text-sm text-[#6B6560] leading-relaxed mb-5">
        Tell us anything else about your world — gadgets, instruments, pets, equipment. The more you share, the more personal your suggestions become.
      </p>
      <textarea
        value={data.inventoryText}
        onChange={e => updateData({ inventoryText: e.target.value })}
        className="w-full h-44 bg-white border border-[#E4E0D8] focus:border-[#1A1815] px-5 py-4 rounded-2xl text-sm text-[#1A1815] placeholder-[#C8C4BC] focus:outline-none transition-all resize-none leading-relaxed"
        placeholder="My golden retriever Sparky, a guitar, coffee grinder, DSLR camera, art supplies…"
      />
      <div className="mt-5 bg-[#EBF2ED] rounded-2xl p-4 border border-[#C8DDD0]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A7B5C] mb-1">✦ Why this matters</p>
        <p className="text-xs text-[#4A7B5C] leading-relaxed">Your inventory helps us suggest activities that are actually possible with what you own — not generic ideas, but things tailored specifically to your life.</p>
      </div>
    </div>

    <div className="pt-4">
      <PrimaryBtn onClick={onComplete} disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoaderIcon className="w-4 h-4 animate-spin" /> Setting up your sanctuary…
          </span>
        ) : "Enter Your Sanctuary →"}
      </PrimaryBtn>
    </div>
  </Shell>
);
