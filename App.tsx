
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SCENARIOS } from './constants';
import { Scenario, ChatMessage, Sender } from './types';
import ScenarioCard from './components/ScenarioCard';
import ChatBubble from './components/ChatBubble';
import InputArea from './components/InputArea';
import { sendMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- Text-to-Speech Setup ---
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup on unmount
    return () => {
       window.speechSynthesis.cancel();
    };
  }, []);

  const playAudio = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;

    // Split text into sentences for more natural pauses
    // Regex splits by punctuation (. ! ?) but keeps the punctuation
    const sentenceChunks = text.match(/[^.?!]+[.?!]+|[^.?!]+$/g) || [text];

    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural sounding "Google" voices if available on Chrome
    const preferredVoice = 
      voices.find(v => v.name.includes("Google US English")) || 
      voices.find(v => v.name.includes("Samantha")) || // MacOS standard
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en"));

    let currentChunkIndex = 0;

    const speakNextChunk = () => {
      if (currentChunkIndex >= sentenceChunks.length || !isSpeakingRef.current) {
        isSpeakingRef.current = false;
        return;
      }

      const chunkText = sentenceChunks[currentChunkIndex].trim();
      if (!chunkText) {
        currentChunkIndex++;
        speakNextChunk();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = 'en-US';
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Apply Scenario-specific voice settings
      if (selectedScenario?.voiceSettings) {
        utterance.pitch = selectedScenario.voiceSettings.pitch;
        utterance.rate = selectedScenario.voiceSettings.rate;
      } else {
        utterance.pitch = 1;
        utterance.rate = 1;
      }

      utterance.onend = () => {
        currentChunkIndex++;
        // Small "breathing" pause between sentences
        setTimeout(speakNextChunk, 250);
      };

      utterance.onerror = (e) => {
        console.error("TTS Error", e);
        isSpeakingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  }, [selectedScenario]);

  // Ensure audio stops if we go back to menu
  const handleBackToMenu = () => {
    isSpeakingRef.current = false;
    window.speechSynthesis.cancel();
    setSelectedScenario(null);
    setMessages([]);
    setSuggestedReplies([]);
    setSearchTerm("");
  };

  const handleScenarioSelect = (scenario: Scenario) => {
    // We set state first, but need to wait for render or pass scenario explicitly to audio
    // Since state update is async, we pass scenario to a temp wrapper or just update state 
    // and let a useEffect trigger audio? 
    // Easier: Update playAudio dependency to read from the 'scenario' arg if needed, 
    // but playAudio uses 'selectedScenario' state.
    // workaround: We set state, but we manually trigger audio with the NEW scenario config logic
    // actually, simpler to just set selectedScenario then call playAudio.
    // However, playAudio closes over 'selectedScenario'. 
    // We will update the logic in playAudio to prefer the state, but we need the state to update first.
    // Instead of complex effects, let's just make playAudio accept optional settings.
    
    // Actually, React state updates are batched. 
    // Let's just set the scenario. Then call playAudio. 
    // To ensure playAudio has the *new* settings, we can pass the settings directly to playAudio 
    // or refactor playAudio. 
    // Given the component structure, let's fix playAudio above to access a ref or passed argument?
    // No, standard way: 
    setSelectedScenario(scenario);
    
    // We delay the initial audio slightly to allow state to settle or we can just 
    // pass the settings explicitly to a modified playAudio. 
    // For simplicity in this change block, I will rely on a small timeout for the first message
    // OR better: I will move the initial message creation into a useEffect that watches selectedScenario.
  };

  // Effect to trigger initial greeting when scenario is selected
  useEffect(() => {
    if (selectedScenario && messages.length === 0) {
       const initialMsg = {
        id: uuidv4(),
        sender: Sender.Bot,
        text: selectedScenario.initialPrompt,
        timestamp: Date.now()
      };
      setMessages([initialMsg]);
      setSuggestedReplies([]);
      // Small timeout to ensure the UI is ready and feels natural
      setTimeout(() => playAudio(selectedScenario.initialPrompt), 500);
    }
  }, [selectedScenario, playAudio]); // Added playAudio and selectedScenario as deps

  const processMessage = async (newHistory: ChatMessage[], userText: string | null, audioBase64?: string) => {
    if (!selectedScenario) return;
    setIsLoading(true);
    setSuggestedReplies([]);

    try {
      const data = await sendMessageToGemini(newHistory, selectedScenario, userText, audioBase64);
      if (audioBase64 && data.userTranscript) {
        setMessages(prev => {
           const updated = [...prev];
           const lastMsgIndex = updated.length - 1;
           if (lastMsgIndex >= 0) {
             updated[lastMsgIndex] = {
               ...updated[lastMsgIndex],
               text: data.userTranscript || "Audio Message"
             };
           }
           return updated;
        });
      }

      const botMsg: ChatMessage = {
        id: uuidv4(),
        sender: Sender.Bot,
        text: data.roleplayResponse,
        tutorNote: data.tutorNote,
        suggestedReplies: data.suggestedReplies,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      setSuggestedReplies(data.suggestedReplies);
      playAudio(data.roleplayResponse);

    } catch (error) {
      console.error("Failed to generate response", error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        sender: Sender.Bot,
        text: "Sorry, I'm having trouble connecting to the server. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = async (text: string) => {
    if (!selectedScenario) return;
    // Stop bot speaking if user interrupts
    isSpeakingRef.current = false;
    window.speechSynthesis.cancel();

    const userMsg: ChatMessage = {
      id: uuidv4(),
      sender: Sender.User,
      text: text,
      timestamp: Date.now(),
      isAudioMessage: false
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    await processMessage(newHistory, text);
  };

  const handleSendAudio = async (audioBase64: string) => {
     if (!selectedScenario) return;
     // Stop bot speaking if user interrupts
     isSpeakingRef.current = false;
     window.speechSynthesis.cancel();

     const userMsg: ChatMessage = {
       id: uuidv4(),
       sender: Sender.User,
       text: "🎤 Processing audio...",
       timestamp: Date.now(),
       isAudioMessage: true
     };
     const newHistory = [...messages, userMsg];
     setMessages(newHistory);
     await processMessage(newHistory, null, audioBase64);
  };

  // Filter Scenarios
  const filteredScenarios = SCENARIOS.filter(scenario => 
    scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    scenario.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Background Blobs ---
  const BackgroundBlobs = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
    </div>
  );

  // --- Render Scenario Selector ---
  if (!selectedScenario) {
    return (
      <div className="h-screen w-full relative bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 overflow-hidden">
        <BackgroundBlobs />
        
        {/* Scrollable Container */}
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide z-10">
          <div className="min-h-full py-12 px-4 flex flex-col items-center">
            
            <header className="text-center mb-10 max-w-2xl animate-fade-in-up w-full">
              <div className="inline-block p-4 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg shadow-indigo-100/50 mb-6 ring-1 ring-white">
                <img 
                   src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Owl.png" 
                   alt="Owl" 
                   className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-md"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-4 tracking-tight pb-2">
                LingoGuide
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium mb-8">
                Your immersive, AI-powered English companion.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-md mx-auto group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Find a scenario (e.g., 'Coffee', 'Job')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all"
                />
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full max-w-7xl pb-10">
              {filteredScenarios.length > 0 ? (
                filteredScenarios.map(scenario => (
                  <ScenarioCard 
                    key={scenario.id} 
                    scenario={scenario} 
                    onClick={handleScenarioSelect} 
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-slate-500 bg-white/30 rounded-3xl border border-white/50 backdrop-blur-sm">
                  <p className="text-lg">No scenarios found for "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-indigo-600 font-bold hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- Render Chat Interface ---
  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <BackgroundBlobs />
      
      {/* Glass Header */}
      <header className="glass border-b border-white/40 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToMenu}
            className="p-2.5 hover:bg-white/80 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm ring-1 ring-slate-100/50"
            title="Back to Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-3 text-lg">
              <img 
                src={selectedScenario.iconUrl} 
                alt={selectedScenario.emoji}
                className="w-8 h-8 object-contain drop-shadow-sm" 
              />
              <span className="truncate max-w-[150px] sm:max-w-md">{selectedScenario.title}</span>
            </h2>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
           <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Live Session</span>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col pb-4">
          <div className="text-center mb-8 mt-2 opacity-60">
             <span className="bg-white/60 backdrop-blur text-slate-500 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold shadow-sm">
               Today • {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}
             </span>
          </div>
          
          {messages.map((msg) => (
            <ChatBubble 
              key={msg.id} 
              message={msg} 
              onPlayAudio={msg.sender === Sender.Bot ? playAudio : undefined}
            />
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start mb-8 animate-fade-in-up">
               <div className="flex items-center gap-3 max-w-[70%]">
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-md p-1">
                   <img 
                     src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Owl.png" 
                     className="w-full h-full object-contain"
                   />
                 </div>
                 <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 z-20 bg-gradient-to-t from-white/90 via-white/50 to-transparent">
        <InputArea 
          onSendText={handleSendText}
          onSendAudio={handleSendAudio}
          isLoading={isLoading} 
          suggestedReplies={suggestedReplies}
        />
      </footer>
    </div>
  );
};

export default App;
