
import React from 'react';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => (
  <div className="min-h-screen bg-ios-bg font-sans pb-16">
    <div className="max-w-lg mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ios-muted mb-8 hover:text-ios-text transition-colors"
      >
        ← Back
      </button>

      <h1 className="text-4xl font-serif italic text-ios-text mb-1">Privacy Policy</h1>
      <p className="text-[10px] text-ios-muted uppercase tracking-widest mb-8">Effective: April 2025</p>

      {[
        {
          title: 'What we collect',
          body: `Life Companion collects only what you choose to share during onboarding and use of the app: your name or Google account name, the items in your inventory (streaming services, games, gear, hobbies), your selected mood and time preferences, and activity suggestions you interact with. We do not collect location data, contacts, or any data from third-party apps.`,
        },
        {
          title: 'How your data is stored',
          body: `All personal data — your inventory, goals, hobbies, chat history, and preferences — is stored locally on your device using browser storage. It is not uploaded to our servers and is not accessible to us. Clearing your browser data will permanently delete your Life Companion data. We recommend noting your key inventory items before clearing your browser.`,
        },
        {
          title: 'Payments',
          body: `Premium subscriptions are processed securely by Stripe, a PCI-compliant payment processor. Life Companion never sees or stores your payment card details. Stripe's privacy policy applies to all payment transactions. Your subscription status (free or premium) is stored in our database solely to determine which features you can access.`,
        },
        {
          title: 'AI and suggestions',
          body: `When the AI companion feature is enabled, your mood, inventory summary, and message are sent to Google's Gemini API to generate responses. We do not store these conversations on our servers. If the AI feature is paused, all suggestions are generated entirely on-device using our local engine with no external API calls.`,
        },
        {
          title: 'Third-party services',
          body: `Music suggestion links open Spotify in a new tab via deep links — no personal data is shared with Spotify by Life Companion and no Spotify account connection is required. Google Sign-In is optional; if used, only your display name is read.`,
        },
        {
          title: 'Data retention',
          body: `We do not retain your personal inventory or usage data on our servers. Subscription status is retained as long as your account is active and deleted upon cancellation. You can request deletion at any time by contacting us.`,
        },
        {
          title: 'Your rights',
          body: `You have the right to access, correct, or delete any personal data we hold about you. To exercise these rights, contact us at the address below. As most data is stored locally on your device, you can delete it at any time by clearing your browser storage.`,
        },
        {
          title: 'Contact',
          body: `If you have any questions about this privacy policy or how we handle your data, please contact us at: privacy@lifecompanion.app`,
        },
      ].map(section => (
        <div key={section.title} className="mb-7">
          <h2 className="text-sm font-bold text-ios-text mb-2 uppercase tracking-wider">{section.title}</h2>
          <p className="text-sm text-ios-muted leading-relaxed">{section.body}</p>
        </div>
      ))}

      <div className="mt-10 pt-6 border-t border-ios-border">
        <p className="text-[10px] text-ios-muted text-center">Life Companion · Built with care · {new Date().getFullYear()}</p>
      </div>
    </div>
  </div>
);
