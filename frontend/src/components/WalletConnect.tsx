import React, { useState, useEffect, useRef } from 'react';
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";

const WalletNetwork = { TESTNET: 'TESTNET' };
const allowAllModules = () => [new FreighterModule(), new AlbedoModule()];

import { Wallet, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

interface WalletConnectProps {
  address: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ address, onConnect, onDisconnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      StellarWalletsKit.init({
        network: WalletNetwork.TESTNET as any,
        selectedWalletId: 'freighter',
        modules: allowAllModules()
      });
    } catch(e) {
      // Ignore if already initialized
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async (walletId: string) => {
    setIsConnecting(true);
    setIsOpen(false);
    setError(null);
    try {
      StellarWalletsKit.setWallet(walletId);
      const { address: publicKey } = await StellarWalletsKit.getAddress();
      onConnect(publicKey);
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("not installed") || e?.message?.includes("extension")) {
        setError(`Wallet extension not found for ${walletId}.`);
      } else {
        setError(e?.message || `Failed to connect to ${walletId}.`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {address ? (
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-surface border border-white/10 rounded-xl font-mono text-sm text-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </div>
          <button 
            onClick={handleDisconnect}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Connect Wallet
            <ChevronDown className="w-4 h-4" />
          </button>

          {isOpen && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => handleConnect('freighter')}
                className="w-full text-left px-4 py-3 hover:bg-white/5 text-white text-sm font-medium transition-colors"
              >
                Freighter
              </button>
              <button
                onClick={() => handleConnect('albedo')}
                className="w-full text-left px-4 py-3 hover:bg-white/5 text-white text-sm font-medium transition-colors border-t border-white/5"
              >
                Albedo
              </button>
            </div>
          )}
          
          {error && (
            <div className="absolute top-full mt-14 w-max max-w-xs bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2 shadow-xl backdrop-blur-md z-40">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
