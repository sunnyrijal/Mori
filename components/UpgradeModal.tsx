import React, { useEffect, useState } from 'react';
import { XIcon, StarIcon, CheckCircleIcon } from './icons/Icons';
import { Capacitor } from '@capacitor/core';
import { Purchases, PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: 'Best') => void;
  username?: string | null;
}

const premiumFeatures = [
  "Unlimited AI Chat",
  "Advanced AI Suggestions",
  "Partner Sync Features",
  "Cloud Data Backup",
  "Exclusive Themes & Icons",
  "Priority Support",
];

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: { interval: string };
}

interface StripeProduct {
  id: string;
  name: string;
  prices: StripePrice[];
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, username }) => {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [rcPackages, setRcPackages] = useState<PurchasesPackage[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMobile = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isOpen) return;
    
    if (isMobile) {
      Purchases.getOfferings().then((offerings) => {
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setRcPackages(offerings.current.availablePackages);
        }
      }).catch(console.error);
      return;
    }

    fetch('/api/stripe/products')
      .then(r => r.json())
      .then(json => setProducts(json.data || []))
      .catch(() => setProducts([]));
  }, [isOpen, isMobile]);

  const handleCheckout = async (priceId: string, label: string) => {
    setLoadingCheckout(label);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: username || 'guest',
          userName: username,
        }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error || 'Unable to start checkout. Please try again.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoadingCheckout(null);
    }
  };

  const handleRevenueCatPurchase = async (pkg: PurchasesPackage) => {
    setLoadingCheckout(pkg.identifier);
    setError(null);
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      if (typeof customerInfo.entitlements.active['Premium'] !== "undefined") {
        onUpgrade('Best');
        onClose();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        setError(e.message || "Purchase failed");
      }
    } finally {
      setLoadingCheckout(null);
    }
  };

  const getPricesByInterval = () => {
    const all: { price: StripePrice; interval: string; label: string }[] = [];
    for (const product of products) {
      for (const price of product.prices) {
        const interval = price.recurring?.interval || 'one-time';
        const amount = (price.unit_amount / 100).toFixed(2);
        const label = interval === 'year'
          ? `Annual — $${amount}`
          : interval === 'month'
          ? `Monthly — $${amount}`
          : `One-time — $${amount}`;
        all.push({ price, interval, label });
      }
    }
    all.sort((a, b) => {
      if (a.interval === 'year') return -1;
      if (b.interval === 'year') return 1;
      return 0;
    });
    return all;
  };

  const prices = getPricesByInterval();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-ios-card  border border-ios-border  shadow-2xl w-full max-w-md p-8 relative rounded-[2rem] animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-ios-muted hover:text-ios-text transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center h-14 w-14 bg-ios-accent/10 rounded-2xl rotate-12 border border-ios-accent/20">
            <StarIcon className="h-6 w-6 text-ios-accent" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-serif italic text-ios-text  leading-tight">Elevate Your Space</h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ios-muted">Premium Membership</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {premiumFeatures.map(feature => (
            <div key={feature} className="flex items-center gap-3 p-2.5 bg-ios-bg  rounded-xl border border-ios-border/50">
              <CheckCircleIcon className="w-4 h-4 text-ios-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-ios-text ">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {error && (
            <p className="text-center text-[10px] text-red-500">{error}</p>
          )}

          {isMobile ? (
             rcPackages.length > 0 ? (
               rcPackages.map((pkg, i) => (
                 <button
                   key={pkg.identifier}
                   onClick={() => handleRevenueCatPurchase(pkg)}
                   disabled={!!loadingCheckout}
                   className={`w-full py-4 font-bold text-[10px] uppercase tracking-[0.3em] transition-all rounded-2xl ${
                     i === 0
                       ? 'bg-ios-accent text-white hover:bg-black shadow-lg shadow-ios-accent/20'
                       : 'bg-ios-bg  text-ios-muted hover:bg-ios-border :bg-gray-700'
                   } disabled:opacity-60`}
                 >
                   {loadingCheckout === pkg.identifier ? 'Loading…' : `${pkg.packageType} — ${pkg.product.priceString}`}
                 </button>
               ))
             ) : (
                <p className="text-center text-[10px] text-ios-muted">No mobile plans available right now.</p>
             )
          ) : (
            prices.length > 0 ? (
              prices.map(({ price, label }, i) => (
                <button
                  key={price.id}
                  onClick={() => handleCheckout(price.id, label)}
                  disabled={!!loadingCheckout}
                  className={`w-full py-4 font-bold text-[10px] uppercase tracking-[0.3em] transition-all rounded-2xl ${
                    i === 0
                      ? 'bg-ios-accent text-white hover:bg-black shadow-lg shadow-ios-accent/20'
                      : 'bg-ios-bg  text-ios-muted hover:bg-ios-border :bg-gray-700'
                  } disabled:opacity-60`}
                >
                  {loadingCheckout === label ? 'Loading…' : label}
                </button>
              ))
            ) : (
              <>
                <button
                  disabled
                  className="w-full py-4 bg-ios-accent opacity-50 text-white font-bold text-[10px] uppercase tracking-[0.3em] transition-all rounded-2xl shadow-lg"
                >
                  Annual — Not Available
                </button>
              </>
            )
          )}
        </div>

        <p className="mt-6 text-center text-[9px] text-ios-muted italic">Cancel anytime. Secure checkout via {isMobile ? 'Store' : 'Stripe'}.</p>
      </div>
    </div>
  );
};
