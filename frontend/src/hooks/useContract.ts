import { useState, useCallback, useEffect } from 'react';
import { 
  rpc, 
  TransactionBuilder, 
  Networks, 
  Operation, 
  xdr, 
  scValToNative, 
  nativeToScVal, 
  StrKey 
} from '@stellar/stellar-sdk';
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";

const WalletNetwork = { TESTNET: 'TESTNET' };
const FREIGHTER_ID = 'freighter';
const allowAllModules = () => [new FreighterModule()];

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

export function useContract(walletAddress: string | null) {
  const [target, setTarget] = useState<number>(0);
  const [pledged, setPledged] = useState<number>(0);
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
    try {
      // get target
      const targetTx = new TransactionBuilder(
        await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'), 
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
      .addOperation(Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
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
            contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
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
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, []);

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
            contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
            functionName: 'pledge',
            args: [
              xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(StrKey.decodeEd25519PublicKey(walletAddress))),
              xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(nativeToken))),
              nativeToScVal(stroops, { type: 'i128' })
            ]
          })
        ),
        auth: []
      }))
      .setTimeout(30)
      .build();

      const preparedTx = await server.prepareTransaction(tx);
      
      const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        selectedWalletId: FREIGHTER_ID,
        modules: allowAllModules()
      });

      const signedXdr = await kit.signTransaction(preparedTx.toXDR());
      const signedTx = TransactionBuilder.fromXDR(signedXdr.signedTxXdr, NETWORK_PASSPHRASE);
      
      const submitRes = await server.submitTransaction(signedTx);
      
      let status = 'PENDING';
      let result;
      while (status === 'PENDING') {
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
      setTimeout(() => setTxStatus('IDLE'), 8000);
    }
  };

  return { target, pledged, isFetching, isPledging, pledge, txStatus, txHash, error, setPledged };
}
