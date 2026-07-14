import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface MockPledge {
  id: string;
  address: string;
  amount: number;
  time: string;
}

const generateMockPledges = (): MockPledge[] => {
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `mock-${i}`,
    address: `G${Math.random().toString(36).substring(2, 6).toUpperCase()}...${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    amount: Math.floor(Math.random() * 500) + 50,
    time: `${Math.floor(Math.random() * 59) + 1}m ago`
  }));
};

export const RecentPledges: React.FC = () => {
  const [pledges, setPledges] = useState<MockPledge[]>(generateMockPledges());

  useEffect(() => {
    const interval = setInterval(() => {
      setPledges(prev => {
        const newPledge = {
          id: `mock-${Date.now()}`,
          address: `G${Math.random().toString(36).substring(2, 6).toUpperCase()}...${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          amount: Math.floor(Math.random() * 500) + 50,
          time: 'Just now'
        };
        return [newPledge, ...prev.slice(0, 4)];
      });
    }, 15000); // New pledge every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Live Network Activity</h3>
      </div>
      
      <div className="space-y-4">
        {pledges.map((pledge) => (
          <div key={pledge.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-secondary/20 to-primary/20 flex items-center justify-center">
                <span className="text-xs font-mono text-secondary">XL</span>
              </div>
              <div>
                <p className="text-sm font-medium font-mono text-gray-200">{pledge.address}</p>
                <p className="text-xs text-gray-500">{pledge.time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-secondary">+{pledge.amount} XLM</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
