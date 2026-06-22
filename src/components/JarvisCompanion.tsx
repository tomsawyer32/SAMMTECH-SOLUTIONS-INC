import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, WalletState } from '../types';
import { Bot, Send, Volume2, VolumeX, MessageSquareCode, Disc, HelpCircle, Shield, RefreshCw } from 'lucide-react';

interface JarvisCompanionProps {
  wallet: WalletState;
  btcPrice: number;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
}

export default function JarvisCompanion({ wallet, btcPrice, messages, onSendMessage, isGenerating }: JarvisCompanionProps) {
  const [inputText, setInputText] = useState<string>('');
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Text to speech implementation
  useEffect(() => {
    if (messages.length === 0 || !speechEnabled) return;
    const lastMsg = messages[messages.length - 1];
    
    if (lastMsg.sender === 'jarvis') {
      speakAloud(lastMsg.text);
    }
  }, [messages, speechEnabled]);

  const speakAloud = (text: string) => {
    try {
      if (typeof window === 'undefined') return;
      if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      // Clean text from markdown for better voice pronunciation
      const cleanText = text.replace(/[*#_`[\]]/g, '');
      const utterance = new window.SpeechSynthesisUtterance(cleanText);
      
      // Attempt to set a cool British/English male voice or elegant standard spanish
      const voices = window.speechSynthesis.getVoices();
      
      // Let's search for a British voice if default language looks like English, or elegant Spanish
      const isEn = /^[A-Za-z0-9\s.,?!'"]+$/.test(cleanText);
      let targetVoice = null;
      
      if (isEn) {
        targetVoice = voices.find(v => v.lang.includes('GB') && v.voiceURI.includes('Google')) || 
                      voices.find(v => v.lang.includes('GB')) || 
                      voices.find(v => v.lang.includes('EN'));
        utterance.lang = 'en-GB';
      } else {
        targetVoice = voices.find(v => v.lang.includes('ES') && v.name.toLowerCase().includes('google')) || 
                      voices.find(v => v.lang.includes('ES'));
        utterance.lang = 'es-ES';
      }

      if (targetVoice) utterance.voice = targetVoice;
      utterance.pitch = 0.95; // Slightly deeper Jarvis style
      utterance.rate = 1.05; // Slightly faster smart speed
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesisUtterance constructor or method failed/restricted in this environment:', e);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isGenerating) return;
    onSendMessage(promptText);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md justify-between glow-box-blue max-h-[500px] lg:max-h-none">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-reactor-cyan animate-pulse" />
            <div>
              <span className="font-display font-bold text-sm text-slate-300">JARVIS YAMA-3 INTEGRATION</span>
              <span className="text-[9px] font-mono text-reactor-cyan block leading-none">STARK SYSTEM INTERFACE</span>
            </div>
          </div>

          <button
            id="speech-toggle-btn"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-1.5 rounded border transition-all flex items-center gap-1 font-mono text-[9px] font-bold ${
              speechEnabled 
                ? 'bg-reactor-cyan/10 border-reactor-cyan text-reactor-cyan' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {speechEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>VOICE ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>VOICE OFF</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Holographic Audio Waves */}
        <div className="h-6 w-full bg-slate-950 rounded-lg border border-slate-900 flex items-center justify-center gap-1 px-3 mt-1 mb-3">
          {isGenerating ? (
            Array.from({ length: 24 }).map((_, idx) => (
              <div 
                key={idx} 
                className="w-0.5 bg-reactor-cyan rounded" 
                style={{
                  height: `${Math.floor(Math.random() * 16) + 4}px`,
                  animation: `bounce 0.5s ease-in-out infinite alternate`,
                  animationDelay: `${idx * 0.03}s`
                }}
              />
            ))
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
              <Disc className="w-3.5 h-3.5 text-reactor-cyan shrink-0" />
              <span>JARVIS SYSTEM READY. ASK ANYTHING</span>
            </div>
          )}
        </div>

        {/* Chat History Container */}
        <div 
          id="chat-history-scroll"
          className="h-64 overflow-y-auto pr-1 flex flex-col gap-3 py-1 text-xs font-mono select-text"
          ref={scrollRef}
        >
          {messages.map((msgRef) => (
            <div 
              key={msgRef.id} 
              className={`flex flex-col max-w-[85%] ${msgRef.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className="text-[9px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">
                {msgRef.sender === 'user' ? 'Stark Client' : 'Jarvis-Yama3'}
              </div>
              <div className={`p-3 rounded-2xl border leading-relaxed break-words whitespace-pre-wrap ${
                msgRef.sender === 'user' 
                  ? 'bg-slate-950 border-slate-800 text-white rounded-tr-none' 
                  : 'bg-slate-900 border-reactor-cyan/20 text-slate-300 rounded-tl-none glow-box-blue'
              }`}>
                {msgRef.text}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="self-start flex flex-col items-start gap-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">Jarvis is processing...</span>
              <div className="p-3 bg-slate-900/60 rounded-2xl rounded-tl-none border border-slate-800 text-slate-500 italic max-w-[85%]">
                Computing LLaMA weights...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inputs and helper prompts */}
      <div className="mt-4">
        {/* Quick actions row */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none font-mono text-[9px] select-none py-1">
          <button
            onClick={() => handleQuickPrompt('¿Cómo va mi balance de Stark Coins y Bitcoin?')}
            className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-reactor-cyan/40 text-slate-400 hover:text-white rounded-md shrink-0 transition-all cursor-pointer"
          >
            📊 Check Balance
          </button>
          <button
            onClick={() => handleQuickPrompt('Explícame los contratos inteligentes del casino')}
            className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-reactor-cyan/40 text-slate-400 hover:text-white rounded-md shrink-0 transition-all cursor-pointer"
          >
            🛡️ Solidity Info
          </button>
          <button
            onClick={() => handleQuickPrompt('¿Es Onion.share seguro para casinos anonimos?')}
            className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-reactor-cyan/40 text-slate-400 hover:text-white rounded-md shrink-0 transition-all cursor-pointer"
          >
            🧅 Onion Privacy
          </button>
        </div>

        <form onSubmit={handleSend} className="flex gap-2 font-mono">
          <input
            id="jarvis-prompt-input"
            type="text"
            value={inputText}
            disabled={isGenerating}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Talk with JARVIS (Yama3)..."
            className="flex-1 bg-slate-950 text-white border border-slate-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-reactor-cyan disabled:opacity-50"
          />
          <button
            id="send-chat-btn"
            type="submit"
            disabled={isGenerating || !inputText.trim()}
            className="p-2.5 bg-reactor-cyan text-slate-950 rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer font-bold"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
