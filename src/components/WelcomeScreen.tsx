// WelcomeScreen.tsx — Mobile-friendly hybrid board setup screen
// Allows 1-click automatic board creation or loading existing board key

import { useState } from 'react';
import { Terminal, PlusCircle, LogIn, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateAuto: () => void;
  onJoinBoard: (key: string) => void;
}

export function WelcomeScreen({ onCreateAuto, onJoinBoard }: WelcomeScreenProps) {
  const [boardInput, setBoardInput] = useState('');
  const [showInputMode, setShowInputMode] = useState(false);
  const [inputError, setInputError] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = boardInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanKey) {
      setInputError('Please enter a valid board code.');
      return;
    }
    setInputError('');
    onJoinBoard(cleanKey);
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-5 pt-8 pb-10 min-h-screen bg-[#f7f9fb] text-[#191c1e] animate-in fade-in duration-300">
      {/* Top Header & Brand */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shadow-md">
              <Terminal size={17} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-[#191c1e] leading-none">
                CampusSprint
              </h1>
              <span className="text-[11px] text-[#505f76] font-medium font-mono">
                Mobile Kanban Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hybrid Sync</span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] text-[#0f172a] flex items-center justify-center">
            <Sparkles size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#191c1e] tracking-tight">
              Welcome to Your Sprint Board
            </h2>
            <p className="text-[13px] text-[#505f76] leading-relaxed mt-1">
              Organize academic assignments, development tasks, and team milestones with instant cloud & offline sync.
            </p>
          </div>

          <div className="pt-2 border-t border-[#f2f4f6] flex items-center gap-3 text-[12px] text-[#505f76]">
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Isolated Board Keys</span>
            </div>
            <span>•</span>
            <span>Real-time Sync</span>
          </div>
        </div>
      </div>

      {/* Main Choice Section */}
      <div className="flex flex-col gap-3.5 my-8">
        {/* Option A: Create Auto Board (Primary) */}
        <button
          type="button"
          onClick={onCreateAuto}
          className="
            w-full h-14 min-h-[56px] px-5 rounded-2xl
            bg-[#0f172a] text-white text-[15px] font-bold
            flex items-center justify-between shadow-lg shadow-slate-900/20
            hover:bg-[#1e293b] active:scale-98 transition-all
          "
        >
          <div className="flex items-center gap-3">
            <PlusCircle size={20} strokeWidth={2.2} />
            <span className="text-left">Create New Board</span>
          </div>
          <ArrowRight size={18} strokeWidth={2.2} />
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-[#e0e3e5]" />
          <span className="text-[11px] uppercase tracking-wider text-[#76777d] font-semibold">
            Or join existing
          </span>
          <div className="flex-1 h-px bg-[#e0e3e5]" />
        </div>

        {/* Option B: Enter Existing Board Key (Secondary) */}
        {!showInputMode ? (
          <button
            type="button"
            onClick={() => setShowInputMode(true)}
            className="
              w-full h-13 min-h-[52px] px-5 rounded-2xl
              bg-white text-[#191c1e] text-[14px] font-semibold
              border border-[#e0e3e5] shadow-sm
              hover:bg-[#f2f4f6] active:scale-98 transition-all
              flex items-center justify-center gap-2
            "
          >
            <LogIn size={18} strokeWidth={2} className="text-[#505f76]" />
            <span>Enter My Board Code</span>
          </button>
        ) : (
          <form
            onSubmit={handleJoinSubmit}
            className="bg-white rounded-2xl p-4 border border-[#0f172a] shadow-sm flex flex-col gap-3 animate-in zoom-in-95 duration-150"
          >
            <div>
              <label
                htmlFor="input-board-code"
                className="block text-[12px] font-bold text-[#191c1e] mb-1"
              >
                Board Key / Sync Code
              </label>
              <input
                id="input-board-code"
                type="text"
                autoFocus
                value={boardInput}
                onChange={(e) => {
                  setBoardInput(e.target.value);
                  setInputError('');
                }}
                placeholder="e.g. sprint-7x9a2b"
                className="
                  w-full h-11 px-3.5 rounded-xl bg-[#f7f9fb] border border-[#e0e3e5]
                  text-[14px] font-mono text-[#191c1e]
                  focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all
                "
              />
              {inputError && (
                <p className="text-[11px] text-red-600 font-medium mt-1">
                  {inputError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowInputMode(false);
                  setInputError('');
                }}
                className="h-10 rounded-xl bg-[#f2f4f6] text-[#505f76] text-[13px] font-semibold hover:bg-[#eceef0] active:scale-98 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!boardInput.trim()}
                className="
                  h-10 rounded-xl bg-[#0f172a] text-white text-[13px] font-semibold
                  flex items-center justify-center gap-1.5 shadow-sm
                  hover:bg-[#1e293b] active:scale-98 transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                <span>Load Board</span>
                <ArrowRight size={14} strokeWidth={2.2} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[12px] text-[#76777d]">
        <p>Your tasks are saved securely on this device and synced via Supabase.</p>
      </div>
    </div>
  );
}
