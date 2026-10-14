import React from 'react';
import { AppState } from '@/types';
import { CheckCircleIcon, StarIcon, PlayIcon } from '@/components/icons/Icons';

type LandingScreenProps = {
    onGetStarted: () => void;
    onSelectPlan?: (plan: string) => void;
    isLoggedIn?: boolean;
    onLogout?: () => void;
};

export const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted, onSelectPlan, isLoggedIn, onLogout }) => {
    return (
        <div className="bg-ios-bg min-h-screen text-ios-text overflow-y-auto">
            {/* Header with Pricing Link */}
            <header className="p-6 flex justify-between items-center border-b border-ios-border">
                <h1 className="text-xl font-bold">Gozi</h1>
                <div className="flex gap-4">
                    {isLoggedIn ? (
                        <button onClick={onLogout} className="text-xs font-bold uppercase tracking-widest text-ios-muted hover:text-ios-text transition-colors">Logout</button>
                    ) : (
                        <button onClick={onGetStarted} className="text-xs font-bold uppercase tracking-widest text-ios-muted hover:text-ios-text transition-colors">Login</button>
                    )}
                    <a href="#pricing" className="text-xs font-bold uppercase tracking-widest text-ios-muted hover:text-ios-text transition-colors">Pricing</a>
                </div>
            </header>

            {/* Hero Section */}
            <section className="px-6 py-16 text-center max-w-lg mx-auto space-y-8">
                <h1 className="text-5xl font-black leading-tight tracking-tight">
                    Take back your evenings in 30 seconds.
                </h1>
                <p className="text-lg text-ios-muted">
                    Stop scrolling and start living. Gozi tells you exactly what to do based on your mood, time, and what you already own.
                </p>

                {/* Viral CTA - One Action */}
                <button 
                    onClick={onGetStarted}
                    className="w-full bg-ios-accent text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-ios-accent/20"
                >
                    Find My Perfect Activity
                </button>
            </section>

            {/* Demo / YouTube Thumbnail Placeholder */}
            <section className="px-6 py-8 max-w-lg mx-auto">
                <div className="w-full aspect-video bg-black rounded-2xl relative overflow-hidden flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform shadow-xl">
                    {/* Thumbnail style */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                        <p className="text-white font-bold text-lg">Watch how Gozi works</p>
                    </div>
                    <PlayIcon className="w-16 h-16 text-white absolute z-10 opacity-80" />
                </div>
            </section>

            {/* Social Proof / Empathy */}
            <section className="px-6 py-16 bg-ios-card border-y border-ios-border text-center space-y-6">
                <h2 className="text-2xl font-bold">You have 4 hours of free time every night.</h2>
                <p className="text-ios-muted">Why do you spend 3 of them looking for something to watch?</p>
                <div className="pt-8 space-y-4">
                    <div className="p-6 border border-ios-border rounded-2xl bg-ios-bg text-left shadow-sm">
                        <div className="flex gap-1 mb-3 text-yellow-500">
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                        </div>
                        <p className="font-medium italic">"I used to spend 45 minutes deciding what game to play. Now I just open Gozi and I'm playing in 30 seconds."</p>
                        <p className="text-xs text-ios-muted mt-4 font-bold uppercase tracking-wider">— Mark T.</p>
                    </div>
                    <div className="p-6 border border-ios-border rounded-2xl bg-ios-bg text-left shadow-sm">
                        <div className="flex gap-1 mb-3 text-yellow-500">
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                            <StarIcon className="w-4 h-4 fill-current" />
                        </div>
                        <p className="font-medium italic">"The simplest app on my phone, but the only one that actually improves my life."</p>
                        <p className="text-xs text-ios-muted mt-4 font-bold uppercase tracking-wider">— Sarah L.</p>
                    </div>
                </div>
            </section>

            {/* Popcorn Pricing */}
            <section id="pricing" className="px-6 py-16 text-center max-w-lg mx-auto space-y-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Simple, One-Time Pricing</h2>
                    <p className="text-ios-muted">No subscriptions. Pay once, use forever.</p>
                </div>

                <div className="space-y-4 text-left">
                    {/* Good */}
                    <div className="p-6 border border-ios-border rounded-2xl bg-ios-card shadow-sm">
                        <h3 className="text-xl font-bold">Good</h3>
                        <p className="text-3xl font-black mt-2 mb-4">$19</p>
                        <ul className="space-y-2 mb-6 text-sm">
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> Base Suggestions</li>
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> 20 Inventory Items</li>
                        </ul>
                        <button onClick={() => onSelectPlan ? onSelectPlan('Good') : onGetStarted()} className="w-full py-3 border-2 border-ios-text rounded-xl font-bold hover:bg-ios-text hover:text-white transition-colors">Get Good</button>
                    </div>

                    {/* Better (Highlighted) */}
                    <div className="p-6 border-2 border-ios-accent rounded-2xl bg-ios-card shadow-lg relative">
                        <div className="absolute top-0 right-6 -translate-y-1/2 bg-ios-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
                        <h3 className="text-xl font-bold">Better</h3>
                        <p className="text-3xl font-black mt-2 mb-4">$39</p>
                        <ul className="space-y-2 mb-6 text-sm">
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> Unlimited Suggestions</li>
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> Unlimited Inventory</li>
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> AI Chat</li>
                        </ul>
                        <button onClick={() => onSelectPlan ? onSelectPlan('Better') : onGetStarted()} className="w-full py-3 bg-ios-accent text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-ios-accent/20">Get Better</button>
                    </div>

                    {/* Best */}
                    <div className="p-6 border border-ios-border rounded-2xl bg-ios-card shadow-sm">
                        <h3 className="text-xl font-bold">Best</h3>
                        <p className="text-3xl font-black mt-2 mb-4">$79</p>
                        <ul className="space-y-2 mb-6 text-sm">
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> Everything in Better</li>
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> Partner Sync</li>
                            <li className="flex gap-2"><CheckCircleIcon className="w-5 h-5 text-ios-accent" /> Priority Support</li>
                        </ul>
                        <button onClick={() => onSelectPlan ? onSelectPlan('Best') : onGetStarted()} className="w-full py-3 border-2 border-ios-text rounded-xl font-bold hover:bg-ios-text hover:text-white transition-colors">Get Best</button>
                    </div>
                </div>
            </section>
            
            <footer className="p-8 text-center border-t border-ios-border">
                <p className="text-xs text-ios-muted font-bold uppercase tracking-widest">Built by Gozi · {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};
