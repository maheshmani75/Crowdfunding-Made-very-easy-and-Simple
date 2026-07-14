import React, { useState } from 'react';
import { useContract } from '../hooks/useContract';
import { useContractEvents } from '../hooks/useContractEvents';
import { Loader2, Coins, CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface CampaignCardProps {
  walletAddress: string | null;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ walletAddress }) => {
  const { target, pledged, isFetching, isPledging, pledge, txStatus, error, setPledged } = useContract(walletAddress);
  const [amount, setAmount] = useState<string>('');

  useContractEvents((amountPledged) => {
    setPledged(prev => prev + amountPledged);
  });

  const handlePledge = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      pledge(val);
      setAmount('');
    }
  };

  const progress = target > 0 ? Math.min((pledged / target) * 100, 100) : 0;

  if (isFetching) {
    return (
      <div className="w-full h-64 bg-surface border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-gray-400 font-medium mb-1">Total Pledged</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{pledged.toLocaleString()}</span>
              <span className="text-xl text-primary font-bold">XLM</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 font-medium mb-1">Target</p>
            <p className="text-xl font-bold">{target.toLocaleString()} XLM</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-black/50 rounded-full mb-3 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mb-10">
          <span>{progress.toFixed(1)}% Funded</span>
          <span className="flex items-center gap-1 text-secondary"><TrendingUp className="w-4 h-4"/> Live</span>
        </div>

        {/* Input area */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Coins className="w-5 h-5 text-gray-400" />
            </div>
            <input 
              type="number"
              min="0.1"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to pledge..."
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-lg placeholder:text-gray-500"
              disabled={isPledging}
            />
          </div>
          <button
            onClick={handlePledge}
            disabled={isPledging || !amount}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[120px]"
          >
            {isPledging ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pledge"}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="h-12 flex items-center">
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg w-full border border-red-500/20">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {txStatus === 'PENDING' && (
            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg w-full border border-yellow-500/20">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span className="text-sm font-medium">Transaction Pending... please sign in your wallet.</span>
            </div>
          )}

          {txStatus === 'SUCCESS' && (
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg w-full border border-green-500/20">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Successfully pledged! Thank you.</span>
            </div>
          )}

          {txStatus === 'FAIL' && !error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg w-full border border-red-500/20">
              <XCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Transaction failed.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
