import React, { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { CampaignCard } from './components/CampaignCard';
import { RecentPledges } from './components/RecentPledges';
import { Rocket, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnect = (address: string) => {
    setWalletAddress(address);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      <Toaster position="top-right" toastOptions={{ style: { background: '#15151D', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-surface/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EventFund</span>
          </div>
          
          <div>
            <WalletConnect 
              address={walletAddress} 
              onConnect={handleConnect} 
              onDisconnect={handleDisconnect} 
            />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-12 px-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Stellar Testnet Live</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                Fuel the next big <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Innovation
                </span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Join the decentralized crowdfunding revolution. Pledge your XLM safely and securely using Soroban smart contracts.
              </p>
            </div>
            
            <div className="hidden md:flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-white/5 shadow-lg">
                <TrendingUp className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-sm text-gray-400 font-medium">Total Volume</p>
                  <p className="text-xl font-bold">14,205 XLM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-white/5 shadow-lg">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-gray-400 font-medium">Smart Contracts</p>
                  <p className="text-xl font-bold">100% Secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Main Content */}
      <main className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Campaigns */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Featured Campaign</h2>
              </div>
              
              {/* The Actual Soroban Campaign */}
              <CampaignCard walletAddress={walletAddress} />

              {/* Mock Campaigns */}
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-6 text-gray-300">Trending Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mock 1 */}
                  <div className="bg-surface border border-white/5 rounded-2xl p-6 opacity-75 hover:opacity-100 transition-opacity cursor-not-allowed grayscale-[50%]">
                    <h4 className="text-lg font-bold mb-2">Decentralized AI Hub</h4>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">Building an open-source compute cluster for community AI model training.</p>
                    <div className="w-full bg-black rounded-full h-2 mb-2">
                      <div className="bg-gradient-to-r from-gray-500 to-gray-400 h-2 rounded-full w-[85%]"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>8,500 XLM Pledged</span>
                      <span>10,000 Target</span>
                    </div>
                  </div>
                  {/* Mock 2 */}
                  <div className="bg-surface border border-white/5 rounded-2xl p-6 opacity-75 hover:opacity-100 transition-opacity cursor-not-allowed grayscale-[50%]">
                    <h4 className="text-lg font-bold mb-2">Soroban NFT Marketplace</h4>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">A gas-efficient marketplace for trading digital assets on Stellar.</p>
                    <div className="w-full bg-black rounded-full h-2 mb-2">
                      <div className="bg-gradient-to-r from-gray-500 to-gray-400 h-2 rounded-full w-[30%]"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>1,500 XLM Pledged</span>
                      <span>5,000 Target</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Feed */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <RecentPledges />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Background decorations */}
      <div className="fixed inset-0 -z-20 pointer-events-none bg-background">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[150px]" />
      </div>
    </div>
  );
}

export default App;
