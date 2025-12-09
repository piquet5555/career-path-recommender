import React, { useState } from 'react';
import { AppView, CareerPlan, ResumeCritique } from './types';
import Sidebar from './components/Sidebar';
import CareerGenerator from './components/CareerGenerator';
import ResumeTools from './components/ResumeTools';
import ChatCoach from './components/ChatCoach';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CAREER_PLAN);
  
  // Shared State
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [resumeCritique, setResumeCritique] = useState<ResumeCritique | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-5xl mx-auto p-8 lg:p-12">
        
        {/* Header Section based on View */}
        <header className="mb-8">
           {currentView === AppView.CAREER_PLAN && (
              <div>
                  <h2 className="text-3xl font-bold text-gray-900">Career Planning</h2>
                  <p className="text-gray-500 mt-2">Design your future with data-driven insights.</p>
              </div>
           )}
           {currentView === AppView.RESUME_TOOLS && (
              <div>
                  <h2 className="text-3xl font-bold text-gray-900">Resume Optimization</h2>
                  <p className="text-gray-500 mt-2">Get expert feedback and target specific job opportunities.</p>
              </div>
           )}
           {currentView === AppView.CHAT_COACH && (
              <div>
                  <h2 className="text-3xl font-bold text-gray-900">Coach Chat</h2>
                  <p className="text-gray-500 mt-2">Ask follow-up questions about your plan and resume.</p>
              </div>
           )}
        </header>

        {/* View Content */}
        <div className="transition-all duration-300 ease-in-out">
            {currentView === AppView.CAREER_PLAN && (
            <CareerGenerator 
                onPlanGenerated={(plan) => {
                    setCareerPlan(plan);
                    // Optional: Auto switch to chat to discuss? No, let user decide.
                }}
                existingPlan={careerPlan || undefined}
            />
            )}

            {currentView === AppView.RESUME_TOOLS && (
            <ResumeTools 
                onCritiqueGenerated={(critique) => {
                    setResumeCritique(critique);
                }}
                existingCritique={resumeCritique || undefined}
            />
            )}

            {currentView === AppView.CHAT_COACH && (
            <ChatCoach 
                plan={careerPlan} 
                critique={resumeCritique} 
            />
            )}
        </div>

      </main>
    </div>
  );
};

export default App;