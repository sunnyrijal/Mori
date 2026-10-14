import React, { useState, useEffect } from 'react';
import { HeartIcon, UserIcon, CheckCircleIcon, ShareIcon } from '@/components/icons/Icons';

type PartnerSessionModalProps = {
    isOpen: boolean;
    partnerUsername: string | null;
    onClose: () => void;
    onStartSolo: () => void;
};

export const PartnerSessionModal: React.FC<PartnerSessionModalProps> = ({ isOpen, partnerUsername, onClose, onStartSolo }) => {
    const [isWaiting, setIsWaiting] = useState(true);
    const [hasPartnerResponded, setHasPartnerResponded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsWaiting(true);
            setHasPartnerResponded(false);
            
            // Mock waiting for partner
            const timer = setTimeout(() => {
                if (!partnerUsername) {
                    setIsWaiting(false);
                } else {
                    // Simulating a scenario where partner might not respond
                    setHasPartnerResponded(false);
                    setIsWaiting(false);
                }
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, partnerUsername]);

    const handleShareLink = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Join my Gozi Date Night',
                text: 'I am planning a Date Night on Gozi! Join me.',
                url: 'https://gozi.app/invite'
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText('https://gozi.app/invite');
            alert('Invite link copied to clipboard!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white  rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 :text-white z-10">
                    ✕
                </button>
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-pink-100  text-pink-600  rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <HeartIcon className={`w-10 h-10 ${isWaiting ? 'animate-pulse' : ''}`} />
                        {isWaiting && (
                            <div className="absolute inset-0 border-4 border-pink-400 rounded-full animate-ping opacity-20"></div>
                        )}
                    </div>
                    
                    {isWaiting ? (
                        <>
                            <h2 className="text-2xl font-serif italic text-gray-900  mb-2">Syncing Date Night</h2>
                            <p className="text-sm text-gray-500 ">
                                Waiting for {partnerUsername || 'your partner'} to join the session...
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-serif italic text-gray-900  mb-2">Partner not around?</h2>
                            <p className="text-sm text-gray-500  mb-6">
                                {partnerUsername ? `${partnerUsername} isn't responding right now.` : "You don't have a partner linked yet."} You can plan the date solo or send them an invite link.
                            </p>
                            <div className="space-y-3">
                                <button onClick={() => { onStartSolo(); onClose(); }} className="w-full py-4 bg-[#1A1815]  text-white #1A1815] font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-[#2D2A26] :bg-gray-100 transition-all flex items-center justify-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    Continue Solo
                                </button>
                                <button onClick={handleShareLink} className="w-full py-4 bg-transparent border border-gray-200  text-gray-500 font-bold text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-gray-50 :bg-gray-800 transition-all flex items-center justify-center gap-2">
                                    <ShareIcon className="w-4 h-4" />
                                    Send Invite Link
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
