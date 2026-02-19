import React, { useState, useRef } from 'react';

interface InputAreaProps {
  onSendText: (text: string) => void;
  onSendAudio: (audioBlob: string) => void;
  isLoading: boolean;
  suggestedReplies?: string[];
}

const InputArea: React.FC<InputAreaProps> = ({ onSendText, onSendAudio, isLoading, suggestedReplies }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          onSendAudio(base64String);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSendText(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full p-3 sm:p-4 relative z-20">
      {/* Suggestions Bubble Container */}
      {suggestedReplies && suggestedReplies.length > 0 && !isRecording && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 px-1 scrollbar-hide mask-gradient">
          <div className="flex-shrink-0 w-2"></div>
          {suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => onSendText(reply)}
              disabled={isLoading}
              className="
                whitespace-nowrap px-4 py-2.5 bg-white/70 hover:bg-white/90 backdrop-blur-md
                text-indigo-700 text-sm font-semibold rounded-2xl 
                shadow-sm hover:shadow-lg transition-all border border-white/50
                transform hover:-translate-y-0.5 active:scale-95
              "
            >
              {reply}
            </button>
          ))}
          <div className="flex-shrink-0 w-2"></div>
        </div>
      )}

      {/* Floating Input Bar */}
      <div className="max-w-4xl mx-auto">
        <div className="
          bg-white/80 backdrop-blur-xl rounded-[1.5rem] 
          shadow-xl shadow-indigo-200/30 border border-white/60 
          p-2 flex items-end gap-2 relative transition-all duration-300
        ">
          
          <div className="flex-1 relative">
            {isRecording ? (
               <div className="w-full h-[52px] flex items-center justify-center bg-rose-50/80 rounded-2xl animate-pulse text-rose-600 font-bold gap-3 border border-rose-100/50 backdrop-blur-sm">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </div>
                  Recording...
               </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                disabled={isLoading}
                className="
                  w-full pl-5 pr-12 py-3.5 bg-transparent border-0 focus:ring-0 
                  resize-none max-h-32 min-h-[52px] 
                  text-slate-700 placeholder-slate-400 font-medium leading-relaxed
                "
                rows={1}
                style={{ minHeight: '52px' }}
              />
            )}
            
            {/* Microphone Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || (!!text && !isRecording)}
              className={`
                absolute right-1.5 bottom-1.5 p-2.5 rounded-xl transition-all duration-300
                ${isRecording 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105 ring-4 ring-rose-100' 
                  : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
                }
                ${(isLoading || (!!text && !isRecording)) ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}
              `}
            >
              {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
              )}
            </button>
          </div>

          {/* Send Button (Text) */}
          {!isRecording && text.trim() && (
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="
                mb-1 mr-1 p-3 rounded-xl flex items-center justify-center transition-all duration-300
                bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200
                hover:shadow-xl hover:scale-105 active:scale-95
              "
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform -rotate-45 translate-x-0.5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputArea;