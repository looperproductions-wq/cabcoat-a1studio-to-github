import React, { useState } from 'react';
import { Mail, Lock, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface EmailGateModalProps {
  onUnlock: (email: string) => void;
}

export const EmailGateModal: React.FC<EmailGateModalProps> = ({ onUnlock }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      onUnlock(email);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        <div className="bg-indigo-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Unlock Unlimited Edits</h2>
          <p className="text-indigo-100 mt-2 text-sm">You've used your 3 free preview designs.</p>
        </div>

        <div className="p-8">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-slate-700">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm font-medium">Unlimited high-quality 4K renders</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm font-medium">Access to all paint colors & hardware</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm font-medium">Save and download designs without watermarks</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  Get Unlimited Access <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-slate-400 mt-4">
              We respect your inbox. No spam, ever.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
};