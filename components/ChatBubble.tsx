import React from 'react';
import { ChatMessage, Sender, TutorNote } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (text: string) => void;
}

const TutorNoteCard: React.FC<{ note: TutorNote }> = ({ note }) => {
  const isCorrection = note.type === 'correction';
  const isAlternative = note.type === 'alternative';
  
  // Dynamic styles based on type
  const styles = isCorrection 
    ? { border: 'border-l-rose-400', bg: 'bg-rose-50/80', icon: '💡', title: 'Correction', text: 'text-rose-900', highlight: 'text-rose-700' }
    : isAlternative
      ? { border: 'border-l-emerald-400', bg: 'bg-emerald-50/80', icon: '✨', title: 'Better Way', text: 'text-emerald-900', highlight: 'text-emerald-700' }
      : { border: 'border-l-blue-400', bg: 'bg-blue-50/80', icon: '👍', title: 'Great Job', text: 'text-blue-900', highlight: 'text-blue-700' };

  return (
    <div className={`mt-3 ml-1 rounded-2xl rounded-tl-sm border-l-[3px] ${styles.border} ${styles.bg} p-4 shadow-sm animate-fade-in-up backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg filter drop-shadow-sm">{styles.icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-widest opacity-80 ${styles.text}`}>{styles.title}</span>
      </div>
      
      <div className={`font-semibold text-sm ${styles.highlight} mb-1.5 leading-snug`}>
        "{note.englishContent}"
      </div>
      
      <div className="text-slate-600 text-xs leading-relaxed border-t border-slate-200/50 pt-2">
        {note.indonesianExplanation}
      </div>

      {/* Pronunciation Section */}
      {note.pronunciationTip && (
        <div className="mt-3 pt-2 border-t border-slate-200/50 flex gap-2">
          <div className="flex-shrink-0 mt-0.5 text-violet-600">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
               <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
               <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
             </svg>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 block mb-0.5">Pronunciation Tip</span>
            <div className="text-slate-700 text-xs">
              {note.pronunciationTip}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onPlayAudio }) => {
  const isUser = message.sender === Sender.User;
  const showSpeaker = !isUser && onPlayAudio;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 group animate-fade-in-up`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3 items-end`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-md ring-2 ring-white
          ${isUser ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' : 'bg-white/80 backdrop-blur'}
        `}>
          {isUser ? (
             <span className="text-lg">👤</span>
          ) : (
             <img 
               src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Owl.png" 
               alt="Tutor" 
               className="w-8 h-8 object-contain"
             />
          )}
        </div>

        {/* Message Container */}
        <div className="flex flex-col min-w-0">
          <div
            className={`
              relative px-5 py-3.5 shadow-sm text-[15px] leading-relaxed
              ${isUser 
                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-200/50' 
                : 'glass-card text-slate-800 rounded-2xl rounded-tl-sm'
              }
            `}
          >
            {/* Audio Indicator for User */}
            {isUser && message.isAudioMessage && (
               <div className="flex items-center gap-1.5 text-indigo-100 text-[10px] mb-1 font-bold uppercase tracking-widest opacity-90">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-200 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                 </span>
                 Voice Message
               </div>
            )}

            <div className="flex justify-between items-start gap-3">
              <div className="whitespace-pre-wrap break-words">{message.text}</div>
              
              {showSpeaker && (
                <button 
                  onClick={() => onPlayAudio(message.text)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0 p-1.5 rounded-full hover:bg-indigo-50"
                  title="Listen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Feedback Card */}
          {!isUser && message.tutorNote && (
            <TutorNoteCard note={message.tutorNote} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;