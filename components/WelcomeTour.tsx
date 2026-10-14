import React, { useEffect, useState, useRef } from 'react';

interface TourStep {
    targetId: string;
    title: string;
    text: string;
}

interface WelcomeTourProps {
    username: string;
    onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'current-context-section',
        title: 'Select Your Context',
        text: 'Tell Gozi how you are feeling, who is with you, and how much time you have. Gozi will tailor all suggested activities to fit your exact moment!'
    },
    {
        targetId: 'map-toggle-btn',
        title: 'Explore Local Activities',
        text: 'Tap "Show Map" to find scenic walking routes, local hangouts, or events near your current location. Gozi helps you find things to do nearby!'
    },
    {
        targetId: 'nav-chat-btn',
        title: 'Chat with Gozi',
        text: 'Tap Chat in the navigation bar to start an interactive conversation. Ask for advice, play quick games, or get immediate activity suggestions!'
    }
];

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ username, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const cardRef = useRef<HTMLDivElement>(null);

    const step = TOUR_STEPS[currentStepIndex];

    const updatePosition = () => {
        const el = document.getElementById(step.targetId);
        if (!el) {
            // Fallback: Center the card on screen if target is missing
            setTargetRect(null);
            setPopupStyle({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '320px',
                zIndex: 9999
            });
            return;
        }

        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        const cardWidth = 320;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate horizontal alignment (center over target, clamp to screen margins)
        const targetCenterX = rect.left + rect.width / 2;
        let leftPos = targetCenterX - cardWidth / 2;
        leftPos = Math.max(16, Math.min(viewportWidth - cardWidth - 16, leftPos));

        // Calculate vertical alignment (above or below based on space)
        let style: React.CSSProperties = {
            position: 'fixed',
            left: `${leftPos}px`,
            width: `${cardWidth}px`,
            zIndex: 9999
        };

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceAbove > spaceBelow && rect.top > 250) {
            // Position ABOVE target
            style.bottom = `${viewportHeight - rect.top + 12}px`;
        } else {
            // Position BELOW target
            style.top = `${rect.bottom + 12}px`;
        }

        setPopupStyle(style);
    };

    useEffect(() => {
        updatePosition();
        
        // Listen to layout adjustments to keep position synced
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        // Also update after a short delay to ensure rendering completes
        const timer = setTimeout(updatePosition, 100);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            clearTimeout(timer);
        };
    }, [currentStepIndex, step.targetId]);

    const handleNext = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[9998] pointer-events-auto overflow-hidden">
            {/* Dim backdrop and Spotlight overlay */}
            <div className="absolute inset-0 bg-black/60 transition-opacity duration-300 pointer-events-none" />

            {/* Spotlight Frame */}
            {targetRect && (
                <div
                    className="fixed rounded-2xl border-2 border-ios-accent/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.60)] transition-all duration-300 pointer-events-none"
                    style={{
                        left: `${targetRect.left - 6}px`,
                        top: `${targetRect.top - 6}px`,
                        width: `${targetRect.width + 12}px`,
                        height: `${targetRect.height + 12}px`,
                        zIndex: 9997
                    }}
                />
            )}

            {/* Tour Dialog Card */}
            <div
                ref={cardRef}
                style={popupStyle}
                className="bg-white/95  backdrop-blur border border-ios-border/40  shadow-2xl rounded-3xl p-5 transition-all duration-300 flex flex-col pointer-events-auto"
            >
                {/* Header with mascot avatar */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-ios-bg  border border-ios-border  flex-shrink-0 flex items-center justify-center p-1.5 shadow-sm">
                        <img 
                            src="/gozi-mascot.png" 
                            alt="Gozi" 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-ios-accent">Gozi Guide</p>
                        <h3 className="text-base font-serif italic text-ios-text  leading-tight">{step.title}</h3>
                    </div>
                </div>

                {/* Narrative content */}
                <p className="text-xs text-ios-muted  leading-relaxed mb-5">
                    {currentStepIndex === 0 ? `Hi ${username}! Let's set your context first. ${step.text}` : step.text}
                </p>

                {/* Bottom row actions */}
                <div className="flex items-center justify-between mt-auto">
                    {/* Pagination indicators */}
                    <div className="flex gap-1.5">
                        {TOUR_STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                                    idx === currentStepIndex 
                                        ? 'bg-ios-accent w-4' 
                                        : 'bg-ios-border '
                                }`}
                            />
                        ))}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-2">
                        {currentStepIndex < TOUR_STEPS.length - 1 && (
                            <button
                                onClick={handleSkip}
                                className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-ios-muted hover:text-ios-text :text-white transition-colors"
                            >
                                Skip
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-ios-accent hover:bg-black/80  :bg-blue-700 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl transition-colors shadow-sm"
                        >
                            {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
