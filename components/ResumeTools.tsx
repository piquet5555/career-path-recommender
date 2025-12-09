import React, { useState, useRef } from 'react';
import { critiqueResume, reviseResumeSection } from '../services/geminiService';
import { ResumeCritique } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  onCritiqueGenerated: (critique: ResumeCritique) => void;
  existingCritique?: ResumeCritique;
}

const ResumeTools: React.FC<Props> = ({ onCritiqueGenerated, existingCritique }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'critique' | 'revision'>('critique');
  const [loading, setLoading] = useState(false);
  
  // Revision State
  const [jobDescription, setJobDescription] = useState('');
  const [revisionResult, setRevisionResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        setPdfBase64(base64);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCritique = async () => {
    if (!pdfBase64) return;
    setLoading(true);
    try {
      const result = await critiqueResume(pdfBase64);
      // Rough extraction of score
      const scoreMatch = result.match(/Impact Score.*?(\d+(\.\d+)?)\s*\/\s*10/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
      
      const critiqueData: ResumeCritique = {
        score,
        content: result
      };
      onCritiqueGenerated(critiqueData);
    } catch (error) {
      console.error(error);
      alert("Error analyzing resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!pdfBase64 || !jobDescription) return;
    setLoading(true);
    try {
      const result = await reviseResumeSection(pdfBase64, jobDescription);
      setRevisionResult(result);
    } catch (error) {
      console.error(error);
      alert("Error revising resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* File Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Upload Resume</h3>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 cursor-pointer"
          />
          {file && (
             <span className="text-sm text-green-600 font-medium">
               ✅ {file.name} loaded
             </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">Supported format: PDF only. Maximum size 10MB.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('critique')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'critique' 
                ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Review & Critique
          </button>
          <button
            onClick={() => setActiveTab('revision')}
            className={`flex-1 py-4 text-center font-medium transition ${
              activeTab === 'revision' 
                ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Targeted Revision
          </button>
        </div>

        <div className="p-8">
          {/* CRITIQUE TAB */}
          {activeTab === 'critique' && (
            <div className="space-y-6">
              {!file ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Please upload a PDF resume above to start the critique.</p>
                </div>
              ) : existingCritique ? (
                 <div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-bold text-xl">
                            Score: {existingCritique.score}/10
                        </div>
                        <button 
                            onClick={handleCritique} 
                            disabled={loading}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            {loading ? "Re-analyzing..." : "Run analysis again"}
                        </button>
                    </div>
                    <MarkdownRenderer content={existingCritique.content} />
                 </div>
              ) : (
                <div className="text-center">
                   <p className="text-gray-600 mb-6">Ready to analyze your uploaded resume?</p>
                   <button
                    onClick={handleCritique}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                   >
                     {loading ? "Analyzing..." : "Get AI Critique"}
                   </button>
                </div>
              )}
            </div>
          )}

          {/* REVISION TAB */}
          {activeTab === 'revision' && (
            <div className="space-y-6">
               {!file ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Please upload a PDF resume above to start the revision.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description Text</label>
                    <textarea
                        className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder="Paste the full job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        We recommend pasting the raw text rather than a URL for best accuracy.
                    </p>
                  </div>

                  <button
                    onClick={handleRevision}
                    disabled={loading || !jobDescription}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                   >
                     {loading ? "Rewriting Resume Sections..." : "Generate Targeted Revision"}
                   </button>
                   
                   {revisionResult && (
                       <div className="mt-8 pt-8 border-t border-gray-100">
                           <h3 className="text-xl font-bold text-gray-900 mb-4">Suggested Revisions</h3>
                           <MarkdownRenderer content={revisionResult} />
                       </div>
                   )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeTools;