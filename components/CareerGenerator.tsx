import React, { useState } from 'react';
import { UserProfile, CareerPlan } from '../types';
import { generateCareerRecommendation, generateDetailedCareerPlan } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  onPlanGenerated: (plan: CareerPlan) => void;
  existingPlan?: CareerPlan;
}

// Added 'form' to explicit steps to handle regeneration flow
type GeneratorStep = 'idle' | 'form' | 'analyzing' | 'planning';

const CareerGenerator: React.FC<Props> = ({ onPlanGenerated, existingPlan }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<GeneratorStep>('idle');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    major: '',
    skills: '',
    interests: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('analyzing');

    try {
      // Step 1: Recommend Role
      const recommendation = await generateCareerRecommendation(profile);
      
      // Extract role name (remove markdown bolding if present)
      const roleMatch = recommendation.match(/RECOMMENDED ROLE:\s*(.+?)(\n|$)/i);
      const rawRole = roleMatch ? roleMatch[1].trim() : "Recommended Role";
      const roleName = rawRole.replace(/\*\*/g, '');
      
      setStep('planning');
      
      // Step 2: Generate Detail Plan
      const fullPlan = await generateDetailedCareerPlan(profile, roleName);
      
      const planData: CareerPlan = {
        role: roleName,
        content: recommendation + '\n\n' + fullPlan
      };

      onPlanGenerated(planData);
      
      // CRITICAL FIX: Set step to 'idle' so the conditional check (existingPlan && step === 'idle') passes
      setStep('idle'); 
    } catch (error) {
      console.error(error);
      alert('An error occurred while communicating with the AI Coach.');
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // Logic to show results:
  // We show results if a plan exists AND we are in the 'idle' state.
  // If the user clicks "Regenerate", we switch step to 'form', hiding this block.
  if (existingPlan && step === 'idle') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Career Plan</h2>
            <button 
                onClick={() => setStep('form')} 
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
            >
                ↻ Regenerate Plan
            </button>
         </div>
         <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
             <span className="text-indigo-800 font-semibold">Target Role: </span>
             <span className="text-gray-800 font-bold">{existingPlan.role}</span>
         </div>
         <MarkdownRenderer content={existingPlan.content} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold">Career Plan Generator</h2>
          <p className="opacity-90 mt-1">Tell us about yourself, and we'll map out your future.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g. Alex Chen"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major / Academic Background</label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g. Computer Science Junior, 3.8 GPA"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills & Tools</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g. Python, SQL, React, Public Speaking, Financial Analysis"
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interests & Goals</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g. Building sustainable tech, solving complex algorithms, remote work"
                  value={profile.interests}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg text-white font-semibold shadow-md transition-all 
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {step === 'analyzing' ? 'Analyzing Profile...' : 'Generating Plan...'}
                </span>
              ) : (
                'Generate Career Plan'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CareerGenerator;