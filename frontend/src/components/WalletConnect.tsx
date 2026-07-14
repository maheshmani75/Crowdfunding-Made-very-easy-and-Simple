import React, { useState, useEffect } from 'react';
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
const WalletNetwork = { TESTNET: 'TESTNET' };
const FREIGHTER_ID = 'freighter';
const allowAllModules = () => [new FreighterModule()];
import { Wallet, Loader2, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  address: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ address, onConnect, onDisconnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the kit
  const [kit] = useState(() => new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules()
  }));

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id);
            const publicKey = await kit.getPublicKey();
            onConnect(publicKey);
          } catch (e: any) {
            console.error(e);
            if (e?.message?.includes("not installed") || e?.message?.includes("extension")) {
              setError("Wallet extension not found. Please install Freighter.");
            } else {
              setError(e?.message || "Failed to connect wallet.");
            }
          }
        }
      });
    } catch (e: any) {
      console.error(e);
      setError("Failed to open wallet modal.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  return (
    <div className="relative">
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
        <div className="flex flex-col items-end">
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Connect Wallet
          </button>
          
          {error && (
            <div className="absolute top-full mt-2 w-max max-w-xs bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2 shadow-xl backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
