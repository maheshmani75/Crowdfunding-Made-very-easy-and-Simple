import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useContractEvents } from '../hooks/useContractEvents';
import { Loader2, Coins, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

interface CampaignCardProps {
  walletAddress: string | null;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ walletAddress }) => {
  const { target, pledged, isFetching, isPledging, pledge, txStatus, txHash, error, setPledged } = useContract(walletAddress);
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

  // Watch for transaction status changes to trigger rich feedback
  useEffect(() => {
    if (txStatus === 'SUCCESS') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6D28D9', '#00D2FF', '#ffffff']
      });
      toast.success(
        (t) => (
          <div className="flex flex-col gap-1">
            <span className="font-bold">Pledge Successful!</span>
            {txHash && (
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-primary hover:text-secondary underline"
              >
                Verify on Explorer
              </a>
            )}
          </div>
        ),
        { icon: '🎉', duration: 8000 }
      );
    } else if (txStatus === 'FAIL') {
      if (error) {
         toast.error(`Pledge Failed: ${error}`);
      } else {
         toast.error('Transaction failed on the network.');
      }
    } else if (error && txStatus !== 'FAIL') {
       toast.error(`Error: ${error}`);
    }
  }, [txStatus, error, txHash]);

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
              <span className="text-4xl font-extrabold text-white">{pledged.toLocaleString()}</span>
              <span className="text-xl text-primary font-bold">XLM</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 font-medium mb-1">Target</p>
            <p className="text-xl font-bold text-white">{target.toLocaleString()} XLM</p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-4 bg-black/60 rounded-full mb-3 overflow-hidden shadow-inner border border-white/5 relative">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative transition-all duration-[1500ms] ease-out flex items-center justify-end pr-2 shadow-[0_0_15px_rgba(109,40,217,0.5)]"
            style={{ width: `${Math.max(progress, 5)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
            {progress >= 5 && <div className="w-2 h-2 rounded-full bg-white/80 shadow-sm" />}
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mb-10">
          <span className="font-medium text-white">{progress.toFixed(1)}% Funded</span>
          <span className="flex items-center gap-1 text-secondary font-medium"><TrendingUp className="w-4 h-4"/> Live</span>
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
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-lg text-white placeholder:text-gray-500"
              disabled={isPledging}
            />
          </div>
          <button
            onClick={handlePledge}
            disabled={isPledging || !amount}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[120px] shadow-lg shadow-primary/20"
          >
            {isPledging ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pledge"}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="h-6 flex items-center mt-2">
          {txStatus === 'PENDING' && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="text-sm font-medium">Transaction Pending... please sign in your wallet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

