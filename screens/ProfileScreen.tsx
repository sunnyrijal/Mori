
import React, { useState } from 'react';
import { AppState, RelationshipStatus, UserPreferences } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { UpgradeModal } from '@/components/UpgradeModal';
import { SavedCuresList } from '@/components/SavedCuresList';
import { StarIcon, PlusCircleIcon, XIcon, Link2Icon, ChevronDownIcon, LoaderIcon } from '@/components/icons/Icons';
import { ACHIEVEMENTS, DIGITAL_APPS_LIST } from '@/constants';
import { geminiService } from '@/services/geminiService';

type ProfileScreenProps = {
    state: AppState;
    users?: Record<string, AppState>;
    actions: ReturnType<typeof useAppStore>['actions'];
    onShowPrivacy?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ state, users, actions, onShowPrivacy }) => {
    const { userProfile, hobbies, inventory, savedCures, digitalApps } = state;
    const { logout, resetData, upgradeSubscription, addHobby, deleteHobby, exportData, addFriend, removeFriend, syncWithPartner, removePartner, updateRelationshipStatus, setPartnerUsername, updateLivingSituation, updatePreferences, setActiveScreen, archiveSavedCure, addDigitalApp, removeDigitalApp } = actions;
    
    const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [isHobbiesOpen, setIsHobbiesOpen] = useState(false);

    return (
        <div className="space-y-6 pb-24 animate-fade-in px-1">
            <header className="text-center space-y-3">
                <div className="w-20 h-20 bg-ios-card  mx-auto flex items-center justify-center text-3xl font-serif italic text-ios-accent  rounded-full shadow-sm border border-ios-border ">
                    {userProfile.username?.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                    <h1 className="text-3xl font-serif italic text-ios-text ">{userProfile.username}</h1>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ios-muted">Level {userProfile.level}</p>
                </div>
            </header>
            
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setActiveScreen('Journey')}
                    className="bg-ios-card  p-6 border border-ios-border  rounded-2xl shadow-sm text-center hover:bg-ios-bg :bg-gray-700 active:scale-95 transition-all w-full focus:outline-none"
                >
                    <p className="text-3xl font-serif italic text-ios-text ">{inventory.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted mt-1">Inventory Items</p>
                </button>
                <button
                    onClick={() => {
                        setIsHobbiesOpen(true);
                        setTimeout(() => {
                            const el = document.getElementById('profile-hobbies-section');
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100);
                    }}
                    className="bg-ios-card  p-6 border border-ios-border  rounded-2xl shadow-sm text-center hover:bg-ios-bg :bg-gray-700 active:scale-95 transition-all w-full focus:outline-none"
                >
                    <p className="text-3xl font-serif italic text-ios-text ">{hobbies.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted mt-1">Hobbies</p>
                </button>
            </div>

            <div className="space-y-4">
                <CollapsibleSection title="Achievements">
                    <div className="grid grid-cols-2 gap-4 py-2">
                        {ACHIEVEMENTS.map(ach => (
                            <div key={ach.id} className={`p-4 text-center border rounded-2xl transition-all ${userProfile.achievements.includes(ach.id) ? 'bg-ios-bg border-ios-accent/20 ' : 'bg-ios-card opacity-40 border-ios-border '}`}>
                                <StarIcon className={`w-6 h-6 mx-auto mb-3 ${userProfile.achievements.includes(ach.id) ? 'text-ios-accent ' : 'text-ios-muted'}`} />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-ios-text  break-words">{ach.name}</p>
                                <p className="text-[10px] text-ios-muted  mt-1 leading-tight">{ach.description}</p>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Sanctuary (Saved Cures)">
                    <div className="py-2">
                        <SavedCuresList cures={savedCures || []} onArchive={archiveSavedCure} />
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Daily Refresh History">
                    <div className="py-2 space-y-4">
                        {state.dailyRefreshHistory && state.dailyRefreshHistory.length > 0 ? (
                            state.dailyRefreshHistory.map((item, idx) => (
                                <div key={idx} className="bg-ios-bg  p-4 border border-ios-border  rounded-2xl flex gap-4 items-center">
                                    <div className="w-10 h-10 bg-ios-card  rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                                        💡
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-[8px] text-ios-accent  font-bold uppercase tracking-[0.1em]">{item.date || 'Past'}</p>
                                            <span className="text-[8px] bg-green-50 text-green-600   px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Answered</span>
                                        </div>
                                        <p className="text-sm font-serif italic text-ios-text  leading-tight mb-2">{item.question}</p>
                                        <div className="flex flex-col gap-0.5 text-[10px] text-ios-muted">
                                            <p>Your Answer: <span className="text-ios-text  font-semibold">{item.userAnswer}</span></p>
                                            {item.answer && <p>Correct Answer: <span className="text-green-600  font-semibold">{item.answer}</span></p>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <span className="text-2xl block mb-2">💡</span>
                                <p className="text-sm text-ios-muted font-serif italic">No refreshes answered yet.</p>
                                <p className="text-[10px] text-ios-muted/70 mt-1 uppercase tracking-widest">Complete your daily refreshes on the Today screen</p>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Completed Activities">
                    <div className="py-2 space-y-3">
                        {state.completedSuggestions && state.completedSuggestions.length > 0 ? (
                            state.completedSuggestions.map((title, idx) => (
                                <div key={idx} className="bg-ios-bg  p-4 border border-ios-border  rounded-2xl flex gap-4 items-center">
                                    <div className="w-10 h-10 bg-ios-card  rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                                        ✅
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-[8px] text-ios-accent  font-bold uppercase tracking-[0.1em]">Activity</p>
                                            <span className="text-[8px] bg-green-50 text-green-600   px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Completed</span>
                                        </div>
                                        <p className="text-sm font-serif italic text-ios-text  leading-tight">{title}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <span className="text-2xl block mb-2">✅</span>
                                <p className="text-sm text-ios-muted font-serif italic">No completed activities yet.</p>
                                <p className="text-[10px] text-ios-muted/70 mt-1 uppercase tracking-widest">Mark suggestions as completed on the Today screen</p>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
                
                <div id="profile-hobbies-section">
                    <CollapsibleSection title="Hobbies" isOpen={isHobbiesOpen} onToggle={() => setIsHobbiesOpen(!isHobbiesOpen)}>
                        <HobbiesSection hobbies={hobbies} onAddHobby={addHobby} onDeleteHobby={deleteHobby} />
                    </CollapsibleSection>
                </div>
                
                <CollapsibleSection title="Digital Tools">
                    <DigitalToolsSection digitalApps={digitalApps || []} onAddApp={addDigitalApp} onRemoveApp={removeDigitalApp} />
                </CollapsibleSection>
                
                <CollapsibleSection title="Social"><SocialSection profile={userProfile} users={users} onAddFriend={addFriend} onRemoveFriend={removeFriend} onSyncPartner={syncWithPartner} onRemovePartner={removePartner} onUpdateRelationshipStatus={updateRelationshipStatus} onSetPartnerUsername={setPartnerUsername} onUpdateLivingSituation={updateLivingSituation} onUpdateFamilyProfile={actions.updateFamilyProfile} /></CollapsibleSection>
                
                {(userProfile.relationshipStatus === RelationshipStatus.InARelationship || userProfile.family?.hasKids || userProfile.family?.hasPets) && (
                    <CollapsibleSection title="Family & Partner">
                        <div className="space-y-6">
                            {userProfile.relationshipStatus === RelationshipStatus.InARelationship && (
                                <div className="space-y-4 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-pink-500">Partner</h4>

                                    {userProfile.partnerUsername ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-ios-text ">{userProfile.partnerUsername}</p>
                                                <p className="text-[10px] text-ios-muted mt-0.5">Used for date night & couples suggestions</p>
                                            </div>
                                            <button onClick={removePartner} className="p-1.5 hover:bg-pink-100 text-pink-400 rounded-full transition-colors">
                                                <XIcon className="w-4 h-4 text-pink-400"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-ios-muted">Add your partner's username so we can tailor date nights and couple activities.</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    id="partner-input"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            setPartnerUsername((e.target as HTMLInputElement).value.trim());
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }}
                                                    placeholder="Partner's username..."
                                                    className="flex-1 bg-white p-3 border border-pink-200 focus:outline-none focus:ring-1 focus:ring-pink-400 rounded-xl text-sm text-ios-text"
                                                />
                                                <button onClick={() => {
                                                    const input = document.getElementById('partner-input') as HTMLInputElement;
                                                    if (input.value.trim()) {
                                                        setPartnerUsername(input.value.trim());
                                                        input.value = '';
                                                    }
                                                }} className="px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-colors">
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-1 border-t border-pink-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500 pt-1">Do you live together?</p>
                                        <p className="text-[10px] text-ios-muted">This helps us suggest activities based on where you each are.</p>
                                        <div className="flex gap-2">
                                            {(['together', 'separately'] as const).map(option => (
                                                <button
                                                    key={option}
                                                    onClick={() => updateLivingSituation(option)}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                                                        userProfile.livingSituation === option
                                                            ? 'bg-pink-500 text-white border-pink-500'
                                                            : 'bg-white text-ios-muted border-pink-200 hover:border-pink-400'
                                                    }`}
                                                >
                                                    {option === 'together' ? 'We live together' : 'We live separately'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(userProfile.family?.hasKids || userProfile.family?.hasPets) && (
                                <div className="space-y-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">Family Details</h4>
                                    
                                    {userProfile.family?.hasKids && (
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted">How many kids?</p>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="10" 
                                                    value={userProfile.family.kidsCount || ''} 
                                                    onChange={e => actions.updateFamilyProfile({ kidsCount: parseInt(e.target.value) || undefined })}
                                                    placeholder="e.g. 2"
                                                    className="w-full bg-white p-3 border border-yellow-200 focus:outline-none focus:ring-1 focus:ring-yellow-400 rounded-xl text-sm text-ios-text"
                                                />
                                            </div>
                                            <div className="space-y-2 pt-2 border-t border-yellow-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted">Ages of kids?</p>
                                                <input 
                                                    type="text" 
                                                    value={userProfile.family.kidsAges || ''} 
                                                    onChange={e => actions.updateFamilyProfile({ kidsAges: e.target.value })}
                                                    placeholder="e.g. 3, 5, 8"
                                                    className="w-full bg-white p-3 border border-yellow-200 focus:outline-none focus:ring-1 focus:ring-yellow-400 rounded-xl text-sm text-ios-text"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {userProfile.family?.hasPets && (
                                        <div className={`space-y-3 ${userProfile.family?.hasKids ? 'pt-3 border-t border-yellow-100' : ''}`}>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted">What kind of pets?</p>
                                                <input 
                                                    type="text" 
                                                    value={userProfile.family.pets?.join(', ') || ''} 
                                                    onChange={e => actions.updateFamilyProfile({ pets: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                                    placeholder="e.g. Dog, Cat"
                                                    className="w-full bg-white p-3 border border-yellow-200 focus:outline-none focus:ring-1 focus:ring-yellow-400 rounded-xl text-sm text-ios-text"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}
                <CollapsibleSection title="Privacy Settings">
                    <PrivacySection preferences={userProfile.preferences} onUpdate={updatePreferences} />
                </CollapsibleSection>
                <CollapsibleSection title="Subscription"><SubscriptionSection profile={userProfile} onUpgrade={() => setUpgradeModalOpen(true)} /></CollapsibleSection>
                <CollapsibleSection title="Account Settings">
                    <div className="flex flex-col gap-3 py-2">
                        <button onClick={exportData} className="text-left w-full p-4 bg-ios-bg  hover:bg-ios-border :bg-gray-700 font-bold text-xs uppercase tracking-widest text-ios-text  rounded-xl transition-colors">Export Data</button>
                        <button onClick={logout} className="text-left w-full p-4 bg-ios-bg  hover:bg-ios-border :bg-gray-700 font-bold text-xs uppercase tracking-widest text-ios-text  rounded-xl transition-colors">Logout</button>
                        <button onClick={() => setResetConfirmOpen(true)} className="text-left w-full p-4 bg-ios-bg  hover:bg-red-50 :bg-red-900/20 font-bold text-xs uppercase tracking-widest text-red-500  rounded-xl transition-colors">Reset All Data</button>
                    </div>
                </CollapsibleSection>
            </div>

            <ConfirmationDialog isOpen={isResetConfirmOpen} onClose={() => setResetConfirmOpen(false)} onConfirm={() => { resetData(); setResetConfirmOpen(false); }} title="Reset All Data" message="Are you sure? This will permanently delete your inventory, hobbies, and all your progress. This cannot be undone." confirmText="Yes, Reset Everything"/>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} onUpgrade={upgradeSubscription} username={userProfile.username} />

            <div className="pt-2 pb-4 text-center space-y-1">
                {onShowPrivacy && (
                    <button onClick={onShowPrivacy} className="text-[10px] text-ios-muted hover:text-ios-text transition-colors underline underline-offset-2">Privacy Policy</button>
                )}
                <p className="text-[9px] text-ios-muted/60">Gozi · {new Date().getFullYear()}</p>
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{
    title: string;
    isOpen?: boolean;
    onToggle?: () => void;
    children: React.ReactNode;
}> = ({ title, isOpen: controlledIsOpen, onToggle, children }) => {
    const [localIsOpen, setLocalIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;
    const toggle = onToggle || (() => setLocalIsOpen(!localIsOpen));

    return (
        <div className="bg-ios-card  border border-ios-border  shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
            <button onClick={toggle} className="w-full flex justify-between items-center p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ios-muted">{title}</h2>
                <ChevronDownIcon className={`w-4 h-4 text-ios-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-ios-border/30  animate-fade-in">
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
                    <div key={hobby} className="flex items-center gap-2 bg-ios-bg  text-ios-text  px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full border border-ios-border ">
                        <span>{hobby}</span>
                        <button onClick={() => onDeleteHobby(hobby)} className="text-ios-muted hover:text-red-500 transition-colors"><XIcon className="w-3 h-3"/></button>
                    </div>
                ))}
                {hobbies.length === 0 && <p className="text-xs text-ios-muted italic">No hobbies added yet. Add some to get better suggestions!</p>}
            </div>
            <div className="flex gap-2">
                <input type="text" value={newHobby} onChange={e => setNewHobby(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Add a hobby..." className="flex-1 bg-ios-bg  p-4 border border-ios-border  focus:outline-none focus:ring-1 focus:ring-ios-accent rounded-xl text-sm text-ios-text "/>
                <button onClick={handleAdd} className="p-4 bg-ios-accent  hover:bg-black/80 text-white rounded-xl transition-all"><PlusCircleIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

const AppIcon = ({ name }: { name: string }) => {
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    
    React.useEffect(() => {
        const fetchIcon = async () => {
            try {
                const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=software&limit=1`);
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    setIconUrl(data.results[0].artworkUrl60);
                } else {
                    setHasError(true);
                }
            } catch (e) {
                setHasError(true);
            }
        };
        fetchIcon();
    }, [name]);
    
    if (hasError || !iconUrl) {
        return (
            <div className="w-5 h-5 rounded-md bg-ios-accent flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                {name.charAt(0).toUpperCase()}
            </div>
        );
    }
    
    return (
        <img 
            src={iconUrl} 
            alt={name} 
            className="w-5 h-5 rounded-md object-cover shadow-sm" 
            onError={() => setHasError(true)} 
        />
    );
};

const DigitalToolsSection = ({ digitalApps, onAddApp, onRemoveApp }: { digitalApps: string[], onAddApp: (a: string) => void, onRemoveApp: (a: string) => void }) => {
    const [customApp, setCustomApp] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const handleAdd = () => {
        if (customApp.trim() && !digitalApps.includes(customApp.trim())) {
            onAddApp(customApp.trim());
        }
        setCustomApp('');
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
                    parsedApps.forEach(app => {
                        if (!digitalApps.includes(app)) onAddApp(app);
                    });
                }
            }
            setIsParsing(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-ios-bg  p-4 rounded-2xl border border-ios-border ">
                <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">📸</span>
                    <div>
                        <p className="text-sm font-semibold text-ios-text ">Upload Screenshot</p>
                        <p className="text-[10px] text-ios-muted uppercase tracking-widest mt-0.5">Let Gozi detect them magically</p>
                    </div>
                </div>
                <label className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isParsing ? 'bg-ios-border text-ios-muted cursor-not-allowed' : 'bg-ios-accent text-white cursor-pointer hover:bg-black/80'}`}>
                    {isParsing ? <span className="flex items-center gap-2"><LoaderIcon className="w-3 h-3 animate-spin" /> Parsing...</span> : "Select Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isParsing} />
                </label>
            </div>

            <div className="flex flex-wrap gap-2">
                {digitalApps.map(app => (
                    <div key={app} className="flex items-center gap-2 bg-ios-bg  text-ios-text  px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-ios-border ">
                        <AppIcon name={app} />
                        <span>{app}</span>
                        <button onClick={() => onRemoveApp(app)} className="text-ios-muted hover:text-red-500 transition-colors"><XIcon className="w-3 h-3"/></button>
                    </div>
                ))}
                {digitalApps.length === 0 && <p className="text-xs text-ios-muted italic">No apps added yet. Upload a screenshot or type one below!</p>}
            </div>

            <div className="flex gap-2">
                <input type="text" value={customApp} onChange={e => setCustomApp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Add an app manually..." className="flex-1 bg-ios-bg  p-4 border border-ios-border  focus:outline-none focus:ring-1 focus:ring-ios-accent rounded-xl text-sm text-ios-text "/>
                <button onClick={handleAdd} className="p-4 bg-ios-accent  hover:bg-black/80 text-white rounded-xl transition-all"><PlusCircleIcon className="w-5 h-5"/></button>
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
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${(preferences.profileVisibility ?? 'friends') === opt ? 'bg-ios-accent text-white border-ios-accent' : 'bg-ios-bg  text-ios-muted border-ios-border '}`}
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
            <p className="text-xs font-bold text-ios-text ">{label}</p>
            <p className="text-[10px] text-ios-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
        <button
            onClick={() => onChange(!value)}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-ios-accent' : 'bg-ios-border '}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const SocialSection = ({ profile, users, onAddFriend, onRemoveFriend, onRemovePartner, onUpdateRelationshipStatus, onSetPartnerUsername, onUpdateLivingSituation, onUpdateFamilyProfile }: any) => {
    const [partnerInput, setPartnerInput] = useState('');
    const [friendInput, setFriendInput] = useState('');
    const [expandedFriend, setExpandedFriend] = useState<string | null>(null);
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

    const showFamilyTab = isInRelationship || profile.family?.hasKids || profile.family?.hasPets;

    return (
        <div className='space-y-6'>
            <div className='p-4 bg-ios-bg  rounded-xl border border-ios-border  flex flex-col items-center text-center'>
                <p className='text-[10px] font-bold uppercase tracking-widest text-ios-muted mb-1'>Your Username</p>
                <p className='font-mono font-bold text-ios-text  select-all mb-4'>{profile.username}</p>
                
                {/* Scan-to-Connect QR Code */}
                <div className="bg-white p-3 rounded-2xl border border-ios-border/80  shadow-sm flex items-center justify-center mb-4 transition-transform hover:scale-[1.02] duration-300">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}?add_friend=${profile.username}`)}`} 
                        alt="Username QR Code" 
                        className="w-28 h-28 object-contain"
                    />
                </div>
                
                <p className='text-[9px] text-ios-muted mt-1'>Share this username or scan the QR code to auto-connect as friends.</p>
            </div>

            <div className="space-y-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">Family Status</h4>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-ios-text">Relationship Status</p>
                        </div>
                        <select
                            value={profile.relationshipStatus}
                            onChange={e => onUpdateRelationshipStatus(e.target.value as RelationshipStatus)}
                            className="bg-white p-2 border border-yellow-200 focus:outline-none focus:ring-1 focus:ring-yellow-400 rounded-xl text-xs text-ios-text appearance-none"
                        >
                            {Object.values(RelationshipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-yellow-100">
                        <div>
                            <p className="text-sm font-bold text-ios-text">Do you have kids?</p>
                        </div>
                        <button 
                            onClick={() => onUpdateFamilyProfile({ hasKids: !profile.family?.hasKids })}
                            className={`w-12 h-6 rounded-full relative transition-colors ${profile.family?.hasKids ? 'bg-yellow-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${profile.family?.hasKids ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-yellow-100">
                        <div>
                            <p className="text-sm font-bold text-ios-text">Do you have pets?</p>
                        </div>
                        <button 
                            onClick={() => onUpdateFamilyProfile({ hasPets: !profile.family?.hasPets })}
                            className={`w-12 h-6 rounded-full relative transition-colors ${profile.family?.hasPets ? 'bg-yellow-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${profile.family?.hasPets ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-ios-muted">Friends</h4>
                <div className='space-y-2.5'>
                    {profile.friendUsernames.map((friend: string) => {
                        const friendState = Object.values(users || {}).find((u: any) => u.userProfile?.username === friend) as AppState | undefined;
                        const isExpanded = expandedFriend === friend;
                        return (
                            <div key={friend} className="bg-ios-bg  rounded-2xl border border-ios-border  overflow-hidden transition-all duration-300">
                                {/* Header / Clickable area */}
                                <div 
                                    onClick={() => setExpandedFriend(isExpanded ? null : friend)}
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-ios-border/20 :bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-ios-accent/10 text-ios-accent   rounded-full flex items-center justify-center font-bold text-sm">
                                            {friend.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-ios-text ">{friend}</span>
                                                {friendState ? (
                                                    <span className="text-[8px] bg-green-100 text-green-800   px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Connected</span>
                                                ) : (
                                                    <span className="text-[8px] bg-gray-100 text-gray-800   px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Connecting...</span>
                                                )}
                                            </div>
                                            {friendState && (
                                                <p className="text-[9px] text-ios-muted mt-0.5 font-bold uppercase tracking-wider">Level {friendState.userProfile.level} · {friendState.userProfile.subscriptionTier}</p>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 text-ios-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>

                                {/* Expandable details body */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-ios-border/30  space-y-4 animate-fade-in bg-white/50 ">
                                        {friendState ? (
                                            <>
                                                {/* Hobbies list */}
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-ios-muted">Hobbies</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {friendState.hobbies && friendState.hobbies.length > 0 ? (
                                                            friendState.hobbies.map((hobby: string) => (
                                                                <span key={hobby} className="px-2 py-1 bg-ios-card  text-ios-text  text-[8px] font-bold uppercase tracking-wider rounded-lg border border-ios-border/50 ">
                                                                    {hobby}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <p className="text-[10px] text-ios-muted italic">No hobbies shared.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Public inventory items */}
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-ios-muted">Public Inventory</p>
                                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                                        {friendState.inventory && friendState.inventory.filter((i: any) => i.shareWithFriends).length > 0 ? (
                                                            friendState.inventory.filter((i: any) => i.shareWithFriends).map((item: any) => (
                                                                <div key={item.id} className="flex items-center justify-between p-2.5 bg-ios-card  rounded-xl border border-ios-border/40  text-xs">
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-medium text-ios-text  truncate">{item.name}</p>
                                                                        <p className="text-[9px] text-ios-muted truncate mt-0.5">{item.description || 'No description'}</p>
                                                                    </div>
                                                                    <span className="text-[8px] bg-ios-accent/5 text-ios-accent   px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2 flex-shrink-0">
                                                                        {item.category}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-[10px] text-ios-muted italic">No public inventory items shared.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-ios-muted italic">Profile visibility restricted or data loading in progress...</p>
                                        )}

                                        <div className="pt-2 border-t border-ios-border/30  flex justify-end">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveFriend(friend);
                                                    setExpandedFriend(null);
                                                }}
                                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100  :bg-red-900/30 text-red-600  font-bold text-[9px] uppercase tracking-wider rounded-lg transition-colors"
                                            >
                                                Remove Friend
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {profile.friendUsernames.length === 0 && (
                        <p className="text-xs text-ios-muted italic">No friends added yet. Connect with people for shared suggestions.</p>
                    )}
                </div>
                {profile.subscriptionTier !== 'Better' && profile.subscriptionTier !== 'Best' && profile.friendUsernames.length >= 5 ? (
                    <div className="p-4 bg-ios-bg border border-ios-border rounded-xl text-center space-y-2">
                        <p className="text-xs text-ios-text font-bold">Friend Limit Reached</p>
                        <p className="text-[10px] text-ios-muted">Starter accounts are limited to 5 friends. Upgrade to Pro to add unlimited friends and unlock Family mode!</p>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={friendInput}
                            onChange={e => setFriendInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                            placeholder="Friend's username..."
                            className="flex-1 bg-ios-bg p-4 border border-ios-border focus:outline-none focus:ring-1 focus:ring-ios-accent rounded-xl text-sm text-ios-text"
                        />
                        <button onClick={handleAddFriend} className="p-4 bg-ios-accent hover:bg-black/80 text-white rounded-xl transition-all">
                            <Link2Icon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SubscriptionSection = ({ profile, onUpgrade }: { profile: AppState['userProfile'], onUpgrade: () => void }) => {
    return (
        <div className="bg-ios-bg p-6 flex justify-between items-center border border-ios-border rounded-2xl">
            <div>
                <p className="text-xl font-serif italic text-ios-text">{profile.subscriptionTier === 'None' ? 'No Plan' : `${profile.subscriptionTier} Plan`}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ios-muted mt-1">
                    {profile.subscriptionTier === 'None' ? 'Unlock full access' : 'Lifetime Access'}
                </p>
            </div>
            {profile.subscriptionTier === 'None' && (
                <button onClick={onUpgrade} className="px-6 py-2 bg-ios-accent text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 transition-all rounded-full">Upgrade</button>
            )}
        </div>
    )
}

