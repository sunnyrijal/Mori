import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { SendIcon, LoaderIcon, MicrophoneIcon, StopCircleIcon } from '@/components/icons/Icons';

type ChatScreenProps = {
    state: AppState;
    actions: ReturnType<typeof useAppStore>['actions'];
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ state, actions }) => {
  const { chatHistory, isLoading, isVoiceSessionActive, currentTranscription } = state;
  const { addChatMessage, startVoiceChat, endVoiceChat } = actions;

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory, isLoading, currentTranscription]);

  const handleSend = () => {
    if (input.trim()) {
      addChatMessage(input.trim());
      setInput('');
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    addChatMessage(suggestion);
  };

  return (
    <div className="h-screen flex flex-col bg-ios-bg  transition-colors duration-300">
        <header className="p-4 border-b border-ios-border  bg-white/80  backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
            <div className="w-8" /> {/* Spacer */}
            <h1 className="text-[9px] font-bold uppercase tracking-[0.3em] text-ios-muted">Gozi</h1>
            <div className="w-6 h-6 rounded-full bg-ios-accent/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-ios-accent animate-pulse" />
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40 no-scrollbar">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-ios-accent text-white rounded-tr-none' : 'bg-ios-card text-ios-text border border-ios-border    rounded-tl-none'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.sender === 'ai' && msg.suggestions && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSuggestionClick(s)}
                        className="text-[10px] font-bold uppercase tracking-widest bg-ios-bg text-ios-accent border border-ios-border/50 px-4 py-2 hover:bg-ios-accent hover:text-white transition-all rounded-full"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-ios-muted mt-2 px-1">
                {msg.sender === 'user' ? 'You' : 'Gozi'}
              </span>
            </div>
          ))}
          {isLoading && !isVoiceSessionActive && (
            <div className="flex justify-start items-end gap-2 animate-pulse">
                 <div className="p-4 bg-ios-card  border border-ios-border  rounded-2xl rounded-tl-none">
                    <LoaderIcon className="w-4 h-4 text-ios-muted animate-spin" />
                 </div>
            </div>
          )}
          {isVoiceSessionActive && (
            <div className="space-y-3 py-4">
                {currentTranscription.input && (
                  <div className="flex justify-end">
                    <p className="text-xs text-ios-muted italic bg-ios-accent/5 px-4 py-2 rounded-full border border-ios-accent/10">"{currentTranscription.input}..."</p>
                  </div>
                )}
                {currentTranscription.output && (
                  <div className="flex justify-start">
                    <p className="text-xs text-ios-muted italic bg-ios-card px-4 py-2 rounded-full border border-ios-border">"{currentTranscription.output}..."</p>
                  </div>
                )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-ios-border  bg-white/90  backdrop-blur-md fixed bottom-20 left-0 right-0 max-w-lg mx-auto transition-all duration-300">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isVoiceSessionActive ? "Listening..." : "Message..."}
                disabled={isVoiceSessionActive}
                className="w-full bg-ios-bg  border border-ios-border  px-4 py-3 focus:outline-none focus:ring-1 focus:ring-ios-accent text-sm text-ios-text  disabled:opacity-50 rounded-2xl shadow-inner transition-all"
              />
            </div>
            <button
              onClick={isVoiceSessionActive ? endVoiceChat : startVoiceChat}
              className={`p-3 transition-all rounded-2xl shadow-sm ${isVoiceSessionActive ? 'bg-red-500 text-white animate-pulse' : 'bg-ios-bg hover:bg-ios-border  :bg-gray-700 text-ios-muted'}`}
            >
                {isVoiceSessionActive ? <StopCircleIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isVoiceSessionActive}
              className="p-3 bg-ios-accent text-white hover:bg-black/80 disabled:bg-ios-muted/30 disabled:text-ios-muted transition-all rounded-2xl shadow-sm"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
    </div>
  );
};