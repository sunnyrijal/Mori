
import React, { useState } from 'react';
import { AppState, RelationshipStatus, UserPreferences } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { UpgradeModal } from '@/components/UpgradeModal';
import { StarIcon, PlusCircleIcon, XIcon, Link2Icon, ChevronDownIcon } from '@/components/icons/Icons';
import { ACHIEVEMENTS } from '@/constants';

type ProfileScreenProps = {
    state: AppState;
    actions: ReturnType<typeof useAppStore>['actions'];
    onShowPrivacy?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ state, actions, onShowPrivacy }) => {
    const { userProfile, hobbies, inventory } = state;
    const { logout, resetData, upgradeSubscription, addHobby, deleteHobby, exportData, addFriend, removeFriend, syncWithPartner, removePartner, updateRelationshipStatus, setPartnerUsername, updateLivingSituation, updatePreferences } = actions;
    
    const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    return (
        <div className="space-y-6 pb-24 animate-fade-in px-1">
            <header className="text-center space-y-3">
                <div className="w-20 h-20 bg-ios-card dark:bg-gray-700 mx-auto flex items-center justify-center text-3xl font-serif italic text-ios-accent dark:text-white rounded-full shadow-sm border border-ios-border dark:border-gray-600">
                    {userProfile.username?.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                    <h1 className="text-3xl font-serif italic text-ios-text dark:text-white">{userProfile.username}</h1>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ios-muted">Level {userProfile.level}</p>
                </div>
            </header>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-ios-card dark:bg-gray-800 p-6 border border-ios-border dark:border-gray-700 rounded-2xl shadow-sm text-center">
                    <p className="text-3xl font-serif italic text-ios-text dark:text-white">{inventory.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted mt-1">Inventory Items</p>
                </div>
                <div className="bg-ios-card dark:bg-gray-800 p-6 border border-ios-border dark:border-gray-700 rounded-2xl shadow-sm text-center">
                    <p className="text-3xl font-serif italic text-ios-text dark:text-white">{hobbies.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted mt-1">Hobbies</p>
                </div>
            </div>

            <div className="space-y-4">
                <CollapsibleSection title="Achievements">
                    <div className="grid grid-cols-2 gap-4 py-2">
                        {ACHIEVEMENTS.map(ach => (
                            <div key={ach.id} className={`p-4 text-center border rounded-2xl transition-all ${userProfile.achievements.includes(ach.id) ? 'bg-ios-bg border-ios-accent/20 dark:bg-gray-700/50' : 'bg-ios-card opacity-40 border-ios-border dark:bg-gray-700'}`}>
                                <StarIcon className={`w-6 h-6 mx-auto mb-3 ${userProfile.achievements.includes(ach.id) ? 'text-ios-accent dark:text-blue-400' : 'text-ios-muted'}`} />
                                <p className="text-xs font-bold uppercase tracking-widest text-ios-text dark:text-gray-200">{ach.name}</p>
                                <p className="text-[10px] text-ios-muted dark:text-gray-400 mt-1 leading-tight">{ach.description}</p>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Hobbies"><HobbiesSection hobbies={hobbies} onAddHobby={addHobby} onDeleteHobby={deleteHobby} /></CollapsibleSection>
                <CollapsibleSection title="Social"><SocialSection profile={userProfile} onAddFriend={addFriend} onRemoveFriend={removeFriend} onSyncPartner={syncWithPartner} onRemovePartner={removePartner} onUpdateRelationshipStatus={updateRelationshipStatus} onSetPartnerUsername={setPartnerUsername} onUpdateLivingSituation={updateLivingSituation} /></CollapsibleSection>
                <CollapsibleSection title="Privacy Settings">
                    <PrivacySection preferences={userProfile.preferences} onUpdate={updatePreferences} />
                </CollapsibleSection>
                <CollapsibleSection title="Subscription"><SubscriptionSection profile={userProfile} onUpgrade={() => setUpgradeModalOpen(true)} /></CollapsibleSection>
                <CollapsibleSection title="Account Settings">
                    <div className="flex flex-col gap-3 py-2">
                        <button onClick={exportData} className="text-left w-full p-4 bg-ios-bg dark:bg-gray-700/50 hover:bg-ios-border dark:hover:bg-gray-700 font-bold text-xs uppercase tracking-widest text-ios-text dark:text-blue-400 rounded-xl transition-colors">Export Data</button>
                        <button onClick={logout} className="text-left w-full p-4 bg-ios-bg dark:bg-gray-700/50 hover:bg-ios-border dark:hover:bg-gray-700 font-bold text-xs uppercase tracking-widest text-ios-text dark:text-yellow-400 rounded-xl transition-colors">Logout</button>
                        <button onClick={() => setResetConfirmOpen(true)} className="text-left w-full p-4 bg-ios-bg dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-xs uppercase tracking-widest text-red-500 dark:text-red-400 rounded-xl transition-colors">Reset All Data</button>
                    </div>
                </CollapsibleSection>
            </div>

            <ConfirmationDialog isOpen={isResetConfirmOpen} onClose={() => setResetConfirmOpen(false)} onConfirm={() => { resetData(); setResetConfirmOpen(false); }} title="Reset All Data" message="Are you sure? This will permanently delete your inventory, hobbies, and all your progress. This cannot be undone." confirmText="Yes, Reset Everything"/>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} onUpgrade={upgradeSubscription} username={userProfile.username} />

            <div className="pt-2 pb-4 text-center space-y-1">
                {onShowPrivacy && (
                    <button onClick={onShowPrivacy} className="text-[10px] text-ios-muted hover:text-ios-text transition-colors underline underline-offset-2">Privacy Policy</button>
                )}
                <p className="text-[9px] text-ios-muted/60">Life Companion · {new Date().getFullYear()}</p>
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-ios-card dark:bg-gray-800 border border-ios-border dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ios-muted">{title}</h2>
                <ChevronDownIcon className={`w-4 h-4 text-ios-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-ios-border/30 dark:border-gray-700 animate-fade-in">
                    <div className="pt-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const HobbiesSection = ({ hobbies, onAddHobby, onDeleteHobby }: { hobbies: string[], onAddHobby: (h: string) => void, onDeleteHobby: (h: string) => void }) => {
    const [newHobby, setNewHobby] = useState('');
    const handleAdd = () => { if(newHobby.trim()) { onAddHobby(newHobby.trim()); setNewHobby(''); }};
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {hobbies.map(hobby => (
                    <div key={hobby} className="flex items-center gap-2 bg-ios-bg dark:bg-gray-700 text-ios-text dark:text-gray-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full border border-ios-border dark:border-gray-600">
                        <span>{hobby}</span>
                        <button onClick={() => onDeleteHobby(hobby)} className="text-ios-muted hover:text-red-500 transition-colors"><XIcon className="w-3 h-3"/></button>
                    </div>
                ))}
                {hobbies.length === 0 && <p className="text-xs text-ios-muted italic">No hobbies added yet. Add some to get better suggestions!</p>}
            </div>
            <div className="flex gap-2">
                <input type="text" value={newHobby} onChange={e => setNewHobby(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Add a hobby..." className="flex-1 bg-ios-bg dark:bg-gray-700 p-4 border border-ios-border dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-ios-accent rounded-xl text-sm text-ios-text dark:text-white"/>
                <button onClick={handleAdd} className="p-4 bg-ios-accent dark:bg-blue-600 hover:bg-black/80 text-white rounded-xl transition-all"><PlusCircleIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

const PrivacySection = ({ preferences, onUpdate }: { preferences: UserPreferences, onUpdate: (p: Partial<UserPreferences>) => void }) => {
    return (
        <div className="space-y-4 py-1">
            <ToggleRow
                label="Share with Friends & Partner"
                description="Allow connected friends and your partner to see your inventory and hobbies for better shared suggestions."
                value={preferences.dataSharing ?? true}
                onChange={val => onUpdate({ dataSharing: val })}
            />
            <ToggleRow
                label="Activity Notifications"
                description="Receive nudges and reminders about your suggested activities."
                value={preferences.enableNotifications ?? true}
                onChange={val => onUpdate({ enableNotifications: val })}
            />
            <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted">Profile Visibility</p>
                <p className="text-xs text-ios-muted">Who can find and connect with your profile.</p>
                <div className="flex gap-2 mt-2">
                    {(['private', 'friends'] as const).map(opt => (
                        <button
                            key={opt}
                            onClick={() => onUpdate({ profileVisibility: opt })}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${(preferences.profileVisibility ?? 'friends') === opt ? 'bg-ios-accent text-white border-ios-accent' : 'bg-ios-bg dark:bg-gray-700 text-ios-muted border-ios-border dark:border-gray-600'}`}
                        >
                            {opt === 'private' ? 'Private' : 'Friends Only'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ToggleRow = ({ label, description, value, onChange }: { label: string, description: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between gap-4 py-1">
        <div className="flex-1">
            <p className="text-xs font-bold text-ios-text dark:text-gray-200">{label}</p>
            <p className="text-[10px] text-ios-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
        <button
            onClick={() => onChange(!value)}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-ios-accent' : 'bg-ios-border dark:bg-gray-600'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const SocialSection = ({ profile, onAddFriend, onRemoveFriend, onRemovePartner, onUpdateRelationshipStatus, onSetPartnerUsername, onUpdateLivingSituation }: any) => {
    const [partnerInput, setPartnerInput] = useState('');
    const [friendInput, setFriendInput] = useState('');
    const isInRelationship = profile.relationshipStatus === RelationshipStatus.InARelationship;

    const handleSetPartner = () => {
        if (!partnerInput.trim()) return;
        onSetPartnerUsername(partnerInput.trim());
        setPartnerInput('');
    };

    const handleAddFriend = () => {
        if (!friendInput.trim()) return;
        onAddFriend(friendInput.trim());
        setFriendInput('');
    };

    return (
        <div className='space-y-6'>
            <div className='p-4 bg-ios-bg dark:bg-gray-700/50 rounded-xl border border-ios-border dark:border-gray-600 text-center'>
                <p className='text-[10px] font-bold uppercase tracking-widest text-ios-muted mb-1'>Your Username</p>
                <p className='font-mono font-bold text-ios-text dark:text-gray-200 select-all'>{profile.username}</p>
                <p className='text-[9px] text-ios-muted mt-1'>Share this with friends so they can connect with you.</p>
            </div>

            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-ios-muted">Relationship Status</h4>
                <select
                    value={profile.relationshipStatus}
                    onChange={e => onUpdateRelationshipStatus(e.target.value as RelationshipStatus)}
                    className="w-full bg-ios-bg dark:bg-gray-700 p-4 border border-ios-border dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-ios-accent rounded-xl text-sm text-ios-text dark:text-white appearance-none"
                >
                    {Object.values(RelationshipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {isInRelationship && (
                <div className="space-y-4 p-4 bg-pink-50 dark:bg-pink-900/10 rounded-2xl border border-pink-100 dark:border-pink-900/20">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-pink-500">Partner</h4>

                    {profile.partnerUsername ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-ios-text dark:text-gray-200">{profile.partnerUsername}</p>
                                <p className="text-[10px] text-ios-muted mt-0.5">Used for date night &amp; couples suggestions</p>
                            </div>
                            <button onClick={onRemovePartner} className="p-1.5 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-full transition-colors">
                                <XIcon className="w-4 h-4 text-pink-400"/>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-ios-muted">Add your partner's username so we can tailor date nights and couple activities.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={partnerInput}
                                    onChange={e => setPartnerInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSetPartner()}
                                    placeholder="Partner's username..."
                                    className="flex-1 bg-white dark:bg-gray-700 p-3 border border-pink-200 dark:border-pink-900/40 focus:outline-none focus:ring-1 focus:ring-pink-400 rounded-xl text-sm text-ios-text dark:text-white"
                                />
                                <button onClick={handleSetPartner} className="px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-colors">
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 pt-1 border-t border-pink-100 dark:border-pink-900/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500 pt-1">Do you live together?</p>
                        <p className="text-[10px] text-ios-muted">This helps us suggest activities based on where you each are.</p>
                        <div className="flex gap-2">
                            {(['together', 'separately'] as const).map(option => (
                                <button
                                    key={option}
                                    onClick={() => onUpdateLivingSituation(option)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                                        profile.livingSituation === option
                                            ? 'bg-pink-500 text-white border-pink-500'
                                            : 'bg-white dark:bg-gray-700 text-ios-muted border-pink-200 dark:border-pink-900/30 hover:border-pink-400'
                                    }`}
                                >
                                    {option === 'together' ? 'We live together' : 'We live separately'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-ios-muted">Friends</h4>
                <div className='space-y-2'>
                    {profile.friendUsernames.map((friend: string) => (
                        <div key={friend} className="flex items-center justify-between p-4 bg-ios-bg dark:bg-gray-700 rounded-xl border border-ios-border dark:border-gray-600">
                            <span className='text-sm font-bold text-ios-text dark:text-gray-300'>{friend}</span>
                            <button onClick={() => onRemoveFriend(friend)} className="p-1 hover:bg-ios-border rounded-full transition-colors">
                                <XIcon className="w-4 h-4 text-ios-muted"/>
                            </button>
                        </div>
                    ))}
                    {profile.friendUsernames.length === 0 && (
                        <p className="text-xs text-ios-muted italic">No friends added yet. Connect with people for shared suggestions.</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={friendInput}
                        onChange={e => setFriendInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                        placeholder="Friend's username..."
                        className="flex-1 bg-ios-bg dark:bg-gray-700 p-4 border border-ios-border dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-ios-accent rounded-xl text-sm text-ios-text dark:text-white"
                    />
                    <button onClick={handleAddFriend} className="p-4 bg-ios-accent dark:bg-blue-600 hover:bg-black/80 text-white rounded-xl transition-all">
                        <Link2Icon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const SubscriptionSection = ({ profile, onUpgrade }: { profile: AppState['userProfile'], onUpgrade: () => void }) => {
    return (
        <div className="bg-ios-bg dark:bg-gray-800/50 p-6 flex justify-between items-center border border-ios-border dark:border-gray-700 rounded-2xl">
            <div>
                <p className="text-xl font-serif italic text-ios-text dark:text-white">{profile.subscriptionTier} Plan</p>
                {profile.subscriptionTier === 'Free' && profile.trialEndDate && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted mt-1">Trial: {Math.max(0, Math.ceil((new Date(profile.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left</p>
                )}
            </div>
            {profile.subscriptionTier === 'Free' && (
                <button onClick={onUpgrade} className="px-6 py-2 bg-ios-accent dark:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 transition-all rounded-full">Upgrade</button>
            )}
        </div>
    )
}

