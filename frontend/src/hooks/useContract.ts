import { useState, useCallback, useEffect } from 'react';
import { 
  rpc, 
  TransactionBuilder, 
  Networks, 
  Operation, 
  xdr, 
  scValToNative, 
  nativeToScVal, 
  Address 
} from '@stellar/stellar-sdk';
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";

const WalletNetwork = { TESTNET: 'TESTNET' };
const FREIGHTER_ID = 'freighter';
const allowAllModules = () => [new FreighterModule(), new AlbedoModule()];

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || 'CDL4SNU7TUNK2NA3EU34WALUPPMDFJOBK4GZJ3S44SGDZEOXWBA35DAM';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

export function useContract(walletAddress: string | null) {
  const [target, setTarget] = useState<number>(0);
  const [pledged, setPledged] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [userPledged, setUserPledged] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isPledging, setIsPledging] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAIL'>('IDLE');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const server = new rpc.Server(RPC_URL);

  const fetchState = useCallback(async () => {
    if (!CONTRACT_ID) {
      setIsFetching(false);
      return;
    }
    
    // Fetch contract state
    try {
      // get target
      const targetTx = new TransactionBuilder(
        await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'), 
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
      .addOperation(Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(CONTRACT_ID).toScAddress(),
            functionName: 'get_target',
            args: []
          })
        ),
        auth: []
      }))
      .setTimeout(30)
      .build();

      const targetSim = await server.simulateTransaction(targetTx);
      if (rpc.Api.isSimulationSuccess(targetSim)) {
        const res = scValToNative(targetSim.result.retval);
        setTarget(Number(res) / 10000000);
      }

      // get pledged
      const pledgedTx = new TransactionBuilder(
        await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'), 
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
      .addOperation(Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(CONTRACT_ID).toScAddress(),
            functionName: 'get_pledged',
            args: []
          })
        ),
        auth: []
      }))
      .setTimeout(30)
      .build();

      const pledgedSim = await server.simulateTransaction(pledgedTx);
      if (rpc.Api.isSimulationSuccess(pledgedSim)) {
        const res = scValToNative(pledgedSim.result.retval);
        setPledged(Number(res) / 10000000);
      }
    } catch (e) {
      console.error("Contract fetch error:", e);
    }

    // Fetch wallet specific data
    if (walletAddress) {
      // Fetch balance from Horizon
      try {
        const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
          if (nativeBalance) setUserBalance(parseFloat(nativeBalance.balance));
          else setUserBalance(0);
        } else {
          setUserBalance(0);
        }
      } catch (e) {
        console.error("Failed to fetch balance", e);
        setUserBalance(0);
      }

      // Fetch past pledges for user from events
      try {
        const events = await server.getEvents({
          startLedger: 1000000, // Safe early ledger on testnet
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID],
              topics: [
                [xdr.ScVal.scvSymbol('pledged').toXDR('base64')],
                [new Address(walletAddress).toScVal().toXDR('base64')]
              ]
            }
          ],
          limit: 10000
        });

        if (events.events) {
          let totalUserPledged = 0;
          for (const ev of events.events) {
            const amountStroops = Number(scValToNative(ev.value));
            totalUserPledged += amountStroops / 10000000;
          }
          setUserPledged(totalUserPledged);
        }
      } catch(e) {
        console.error("Failed to fetch user events", e);
      }
    }

    setIsFetching(false);
  }, [walletAddress]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const pledge = async (amount: number) => {
    if (!walletAddress) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!CONTRACT_ID) {
      setError("Contract not configured.");
      return;
    }

    setIsPledging(true);
    setTxStatus('PENDING');
    setTxHash(null);
    setError(null);

    try {
      const account = await server.getAccount(walletAddress);
      const stroops = Math.floor(amount * 10000000);

      // Native XLM token on testnet
      const nativeToken = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

      const tx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: NETWORK_PASSPHRASE
      })
      .addOperation(Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(CONTRACT_ID).toScAddress(),
            functionName: 'pledge',
            args: [
              new Address(walletAddress).toScVal(),
              new Address(nativeToken).toScVal(),
              nativeToScVal(stroops, { type: 'i128' })
            ]
          })
        ),
        auth: []
      }))
      .setTimeout(30)
      .build();

      const preparedTx = await server.prepareTransaction(tx);
      
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(preparedTx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
      
      const submitRes = await server.sendTransaction(signedTx);
      
      let status = 'PENDING';
      let result;
      while (status === 'PENDING' || status === 'NOT_FOUND') {
        await new Promise(r => setTimeout(r, 2000));
        result = await server.getTransaction(submitRes.hash);
        status = result.status;
      }

      if (status === 'SUCCESS') {
        setTxHash(submitRes.hash);
        setTxStatus('SUCCESS');
        await fetchState();
      } else {
        setTxStatus('FAIL');
        setError("Transaction failed. You might have insufficient balance.");
      }

    } catch (e: any) {
      console.error(e);
      setTxStatus('FAIL');
      if (e?.message?.includes("User declined") || e?.message?.includes("rejected")) {
        setError("Transaction rejected by user.");
      } else {
        setError(e?.message || "An error occurred.");
      }
    } finally {
      setIsPledging(false);
      setTimeout(() => setTxStatus('IDLE'), 30000);
    }
  };

  return { target, pledged, userBalance, userPledged, isFetching, isPledging, pledge, txStatus, txHash, error, setPledged };
}
