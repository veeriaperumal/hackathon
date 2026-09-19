import React, { useState } from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import { CheckCircle2, XCircle, AlertCircle, FileText, Send, X, ShieldCheck } from 'lucide-react';

export const ActionPlanPanel: React.FC = () => {
  const { currentPlan, submitDecision, isRecalculating } = useCrisisStore();
  const [operatorNotes, setOperatorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!currentPlan) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-lg h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 text-xs">
        <FileText className="w-8 h-8 mb-2 opacity-50" />
        No active action plan generated. Trigger a scenario or incident to generate recommendations.
      </div>
    );
  }

  const handleDecision = async (decision: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      await submitDecision(currentPlan.planId, decision, operatorNotes);
      setOperatorNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-dark-700 bg-dark-900/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-sm text-gray-200 uppercase tracking-wider">
            10-Min Action Recommendation Plan
          </h2>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold uppercase ${
          currentPlan.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
          currentPlan.status === 'rejected' ? 'bg-red-950 text-red-400 border border-red-800' :
          'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
        }`}>
          {currentPlan.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Executive Summary */}
        <div className="bg-dark-900/80 p-3 rounded-lg border border-dark-700">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Executive Rationale Summary
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">{currentPlan.executiveSummary}</p>
        </div>

        {/* Safety Checks Passed */}
        <div className="bg-dark-900/50 p-2.5 rounded-lg border border-dark-700">
          <div className="text-[11px] font-semibold text-gray-400 mb-1">DETERMINISTIC SAFETY VALIDATION CHECKS:</div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {currentPlan.validation.passedChecks.map((check, idx) => (
              <span key={idx} className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {check.replace('_PASSED', '')}
              </span>
            ))}
            {currentPlan.validation.errors.map((err, idx) => (
              <span key={idx} className="bg-red-950/60 text-red-400 border border-red-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {err}
              </span>
            ))}
          </div>
        </div>

        {/* 10-Min Action Timeline Steps */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-2">Recommended Action Steps</h3>
          {currentPlan.steps.map((step) => (
            <div key={step.stepNumber} className="bg-dark-900 p-3 rounded-lg border border-dark-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-400">{step.minuteWindow} • Step #{step.stepNumber}</span>
                <span className="text-[10px] bg-dark-800 text-gray-300 border border-dark-600 px-1.5 py-0.5 rounded font-mono uppercase">
                  {step.actionType}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-200 mb-1">{step.description}</p>
              <p className="text-[11px] text-gray-400 italic">Rationale: {step.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Operator Decision Bar */}
      {currentPlan.status === 'pending_approval' && (
        <div className="p-3 border-t border-dark-700 bg-dark-900/90 space-y-2">
          <input
            type="text"
            placeholder="Operator Decision Notes (optional)..."
            value={operatorNotes}
            onChange={(e) => setOperatorNotes(e.target.value)}
            className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDecision('approve')}
              disabled={submitting || isRecalculating}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 transition-colors shadow-lg"
            >
              <Send className="w-3.5 h-3.5" /> APPROVE PLAN & DISPATCH
            </button>
            <button
              onClick={() => handleDecision('reject')}
              disabled={submitting || isRecalculating}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 transition-colors shadow-lg"
            >
              <X className="w-3.5 h-3.5" /> REJECT PLAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
