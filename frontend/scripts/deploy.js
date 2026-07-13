import { Keypair, Networks, rpc, TransactionBuilder, xdr, Operation, StrKey, Asset, Contract } from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

// Generate a random keypair for deployment and fund it on testnet
async function main() {
    console.log("Initializing Stellar SDK and connecting to Testnet...");
    const server = new rpc.Server('https://soroban-testnet.stellar.org');
    
    const keypair = Keypair.random();
    console.log(`Generated Deployer Keypair: ${keypair.publicKey()}`);

    console.log("Funding deployer account on testnet...");
    try {
        await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
        console.log("Successfully funded account.");
    } catch (e) {
        console.error("Friendbot error", e);
    }

    // Give it a moment to index
    await new Promise(resolve => setTimeout(resolve, 5000));

    let account = await server.getAccount(keypair.publicKey());
    
    const wasmPath = path.join(process.cwd(), '../contracts/eventfund/target/wasm32-unknown-unknown/release/eventfund.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    console.log(`Loaded WASM file: ${wasmPath} (${wasmBuffer.length} bytes)`);

    // 1. Upload the contract WASM
    console.log("Uploading contract WASM...");
    let uploadTx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeUploadContractWasm(wasmBuffer),
        auth: []
    }))
    .setTimeout(30)
    .build();

    uploadTx = await server.prepareTransaction(uploadTx);
    uploadTx.sign(keypair);

    let uploadResp = await server.sendTransaction(uploadTx);
    console.log("Upload transaction submitted.");
    let uploadTxResult = await server.getTransaction(uploadResp.hash);
    
    // Check status
    while (uploadTxResult.status === 'PENDING' || uploadTxResult.status === 'NOT_FOUND') {
        console.log("Waiting for upload transaction to complete...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        uploadTxResult = await server.getTransaction(uploadResp.hash);
    }

    if (uploadTxResult.status !== 'SUCCESS') {
        console.error("Upload failed", uploadTxResult);
        return;
    }

    // Extract WASM id
    let wasmId;
    let meta = uploadTxResult.resultMetaXdr;
    wasmId = meta.value().sorobanMeta().returnValue().bytes();

    console.log(`Contract WASM ID: ${wasmId.toString('hex')}`);

    // 2. Instantiate the contract
    console.log("Instantiating contract...");
    account = await server.getAccount(keypair.publicKey());

    // Generate random salt
    const salt = Buffer.alloc(32);
    crypto.getRandomValues(salt);

    let createTx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeCreateContract(
            new xdr.CreateContractArgs({
                contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
                    new xdr.ContractIdPreimageFromAddress({
                        address: xdr.ScAddress.scAddressTypeAccount(keypair.xdrPublicKey()),
                        salt: salt,
                    })
                ),
                executable: xdr.ContractExecutable.contractExecutableWasm(wasmId)
            })
        ),
        auth: []
    }))
    .setTimeout(30)
    .build();

    createTx = await server.prepareTransaction(createTx);
    createTx.sign(keypair);

    let createResp = await server.sendTransaction(createTx);
    console.log("Create transaction submitted.");
    let createTxResult = await server.getTransaction(createResp.hash);

    while (createTxResult.status === 'PENDING' || createTxResult.status === 'NOT_FOUND') {
        console.log("Waiting for create transaction to complete...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        createTxResult = await server.getTransaction(createResp.hash);
    }

    if (createTxResult.status !== 'SUCCESS') {
        console.error("Create failed", createTxResult);
        return;
    }

    // Extract contract ID
    meta = createTxResult.resultMetaXdr;
    let contractIdBytes = meta.value().sorobanMeta().returnValue().address().contractId();
    let contractId = StrKey.encodeContract(contractIdBytes);

    console.log(`Contract successfully instantiated!`);
    console.log(`Contract ID: ${contractId}`);

    // Initialize the contract
    console.log("Initializing contract...");
    account = await server.getAccount(keypair.publicKey());

    // admin = keypair, target = 500000000 (50 XLM in stroops), deadline = current time + 30 days
    const targetStroops = 500000000;
    const deadlineStr = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    let initTx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
                contractAddress: xdr.ScAddress.scAddressTypeContract(contractIdBytes),
                functionName: 'init',
                args: [
                    xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(keypair.xdrPublicKey())),
                    xdr.ScVal.scvI128(new xdr.Int128Parts({
                        hi: new xdr.Int64(0, 0),
                        lo: new xdr.Uint64(targetStroops, 0)
                    })),
                    xdr.ScVal.scvU64(new xdr.Uint64(deadlineStr, 0))
                ]
            })
        ),
        auth: []
    }))
    .setTimeout(30)
    .build();

    initTx = await server.prepareTransaction(initTx);
    initTx.sign(keypair);

    let initResp = await server.sendTransaction(initTx);
    console.log("Init transaction submitted.");
    let initTxResult = await server.getTransaction(initResp.hash);

    while (initTxResult.status === 'PENDING' || initTxResult.status === 'NOT_FOUND') {
        console.log("Waiting for init transaction to complete...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        initTxResult = await server.getTransaction(initResp.hash);
    }

    if (initTxResult.status === 'SUCCESS') {
        console.log("Contract initialized successfully!");
        fs.writeFileSync(path.join(process.cwd(), '.env'), `VITE_CONTRACT_ID=${contractId}\n`);
        console.log("Wrote contract ID to frontend/.env");
    } else {
        console.error("Init failed", initTxResult);
    }
}

main().catch(console.error);
