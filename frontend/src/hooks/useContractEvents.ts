import { useEffect, useRef } from 'react';
import { rpc, StrKey, scValToNative } from '@stellar/stellar-sdk';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';
const RPC_URL = 'https://soroban-testnet.stellar.org';

export function useContractEvents(onPledge: (amount: number) => void) {
  const server = new rpc.Server(RPC_URL);
  const cursorRef = useRef<string>('');

  useEffect(() => {
    if (!CONTRACT_ID) return;

    let timeoutId: NodeJS.Timeout;

    const pollEvents = async () => {
      try {
        const events = await server.getEvents({
          startLedger: cursorRef.current ? undefined : await server.getLatestLedger().then(l => l.sequence - 100),
          cursor: cursorRef.current || undefined,
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID],
              topics: [['*']]
            }
          ],
          limit: 10
        });

        if (events.events && events.events.length > 0) {
          for (const ev of events.events) {
            cursorRef.current = ev.pagingToken;
            
            // Check if it's a pledge event
            if (ev.topic[0] && scValToNative(ev.topic[0]) === 'pledged') {
              const amountStroops = Number(scValToNative(ev.value));
              onPledge(amountStroops / 10000000);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching events:", e);
      } finally {
        timeoutId = setTimeout(pollEvents, 5000);
      }
    };

    pollEvents();

    return () => clearTimeout(timeoutId);
  }, [onPledge]);
}
