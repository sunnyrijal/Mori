import React, { useState } from 'react';
import { WeeklySurvey, SurveyQuestion } from '@/types';
import { LoaderIcon, XIcon } from './icons/Icons';

interface WeeklySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, string>) => void;
  survey: WeeklySurvey | null;
  isLoading: boolean;
}

export const WeeklySurveyModal: React.FC<WeeklySurveyModalProps> = ({ isOpen, onClose, onSubmit, survey, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!isOpen || !survey) return null;

  const handleAnswerSelect = (question: string, option: string) => {
    setAnswers(prev => ({ ...prev, [question]: option }));
    // Automatically move to next step after selection
    if (currentStep < survey.questions.length - 1) {
        setTimeout(() => setCurrentStep(s => s + 1), 400);
    }
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const currentQuestion: SurveyQuestion | undefined = survey.questions[currentStep];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-ios-card dark:bg-gray-900 shadow-2xl w-full max-w-lg p-8 relative border border-ios-border dark:border-gray-800 rounded-[2rem] animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-ios-muted hover:text-ios-text transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="text-center space-y-1 mb-6">
            <h2 className="text-2xl font-serif italic text-ios-text dark:text-white leading-tight">Weekly Check-in</h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ios-muted">Help us get to know you better</p>
        </div>

        <div className="w-full bg-ios-bg dark:bg-gray-800 h-1 mb-8 rounded-full overflow-hidden">
          <div 
            className="bg-ios-accent h-full transition-all duration-700 ease-out rounded-full" 
            style={{ width: `${((currentStep + 1) / survey.questions.length) * 100}%` }}
          ></div>
        </div>

        {currentQuestion && (
             <div className="min-h-[260px] flex flex-col">
                <p className="text-lg font-medium text-ios-text dark:text-gray-200 text-center mb-8 leading-relaxed">{currentQuestion.question}</p>
                <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map(option => (
                        <button
                            key={option}
                            onClick={() => handleAnswerSelect(currentQuestion.question, option)}
                            className={`p-4 text-center w-full transition-all duration-300 border rounded-2xl text-[9px] font-bold uppercase tracking-widest ${answers[currentQuestion.question] === option ? 'bg-ios-accent border-ios-accent text-white shadow-lg shadow-ios-accent/20 scale-[1.02]' : 'bg-ios-bg border-ios-border text-ios-muted hover:border-ios-muted/50 dark:bg-gray-800 dark:border-gray-700'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        )}
        
        <div className="flex justify-between items-center mt-8">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ios-muted">{currentStep + 1} of {survey.questions.length}</p>
            
            {currentStep === survey.questions.length - 1 && (
                <button 
                    onClick={handleSubmit} 
                    disabled={isLoading || !answers[currentQuestion.question]} 
                    className="px-6 py-2.5 bg-ios-accent text-white font-bold text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-ios-accent/20 transition-all hover:bg-black"
                >
                    {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : null}
                    Complete
                </button>
            )}
        </div>
      </div>
    </div>
  );
};