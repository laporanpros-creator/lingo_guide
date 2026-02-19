import React from 'react';
import { Scenario } from '../types';

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: (scenario: Scenario) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onClick }) => {
  return (
    <button
      onClick={() => onClick(scenario)}
      className="
        group relative overflow-hidden rounded-[2rem] p-7 text-left transition-all duration-500
        glass-card hover:shadow-2xl hover:shadow-indigo-200/50 hover:-translate-y-2 ring-1 ring-white/60
        flex flex-col h-full bg-white/40
      "
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
           <img 
            src={scenario.iconUrl} 
            alt={scenario.emoji} 
            className="w-full h-full object-contain filter drop-shadow-lg"
            loading="lazy"
           />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors tracking-tight">
          {scenario.title}
        </h3>
        
        <p className="text-sm text-slate-600 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
          {scenario.description}
        </p>

        <div className="mt-auto pt-6 flex items-center text-indigo-600 font-bold text-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-100">
          Start Roleplay
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default ScenarioCard;