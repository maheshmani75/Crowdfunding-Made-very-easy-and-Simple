import React, { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { CampaignCard } from './components/CampaignCard';
import { Rocket, Sparkles } from 'lucide-react';

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Sync wallet address if available in local storage
  useEffect(() => {
    const stored = localStorage.getItem('walletAddress');
    if (stored) setWalletAddress(stored);
  }, []);

  const handleConnect = (address: string) => {
    setWalletAddress(address);
    localStorage.setItem('walletAddress', address);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    localStorage.removeItem('walletAddress');
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
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
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Stellar Testnet Live</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Fuel the next big <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Innovation
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Join the decentralized crowdfunding revolution. Pledge your XLM safely and securely using Soroban smart contracts.
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto">
            <CampaignCard walletAddress={walletAddress} />
          </div>
        </div>
      </main>

      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px]" />
      </div>
    </div>
  );
}

export default App;
