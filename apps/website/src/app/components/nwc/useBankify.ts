import { useEffect, useState } from "react";

const useBankify = () => {
    // State for utxos and nostr_state
    const [utxos, setUtxos] = useState<any[]>([]);
    const [blindSigJS, setBlindSigJS] = useState<any>(null);
    const [bolt11, setBolt11] = useState<any>(null);
    const [nobleSecp256k1, setNobleSecp256k1] = useState<any>(null);

    
    const [super_nostr, setSuperNostr] = useState<any>(null);
    const [nostrState, setNostrState] = useState<any>({
        socket: null,
        nwc_info: {}
    });
     // Access global variables after the component has mounted
     useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check if the external scripts are loaded
            if (!window?.blindSigJS || !window?.super_nostr || !window?.bolt11 || !window?.nobleSecp256k1) {
                console.error('External scripts not loaded yet.');
            }
            setBlindSigJS(window?.blindSigJS);
            setSuperNostr(window?.super_nostr);
            setBolt11(window?.bolt11);
            setNobleSecp256k1(window?.nobleSecp256k1);
        }
    }, []);


    // Helper Functions
    const hexToBytes = (hex: string) => Uint8Array.from(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const bytesToHex = (bytes: Uint8Array) => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

    const getBalance = () => {
        return utxos.reduce((acc, item) => acc + item.amount, 0);
    };

    const decomposeAmount = (amount: number) => {
        let decomposed:any[] = [];
        const getBaseLog = (x: number, y: number) => Math.log(y) / Math.log(x);
        const innerFn = (amt: number) => {
            let exponent = Math.floor(getBaseLog(2, amt));
            decomposed.push(2 ** exponent);
            amount = amt - 2 ** exponent;
            if (amount) innerFn(amount);
        };
        innerFn(amount);
        return decomposed;
    };

    // Fetching UTXOs and Secrets
    const getUtxosAndSecrets = async (amountsToGet: any[], keyset: any, makeBlank: boolean, fullUtxos: boolean) => {
        let outputs = [];
        let secrets = [];
        let numOfIterations = amountsToGet.length;
        // if (makeBlank) numOfIterations = amountsToGet;
        for (let i = 0; i < numOfIterations; i++) {
            let amount = 1;
            if (!makeBlank && !fullUtxos) {
                amount = amountsToGet[i];
            } else if (!makeBlank && fullUtxos) {
                amount = amountsToGet[i].amount;
                keyset = amountsToGet[i].id;
            }
            const secretForMsg = bytesToHex(blindSigJS.getRand(32));
            const message = new blindSigJS.bsjMsg();
            const B_ = await message.createBlindedMessageFromString(secretForMsg);
            const B_hex = blindSigJS.ecPointToHex(B_);
            outputs.push({ amount, id: keyset, B_: B_hex });
            secrets.push([secretForMsg, message]);
        }
        return [outputs, secrets];
    };

    // // Process signatures to UTXOs
    const processSigs = (sigs: any[], secrets: any[], pubkeys: any) => {
        const utxosToReturn = [];
        for (let i = 0; i < sigs.length; i++) {
            const sigData = sigs[i];
            const id = sigData.id;
            const amount = sigData.amount;
            const secret = secrets[i][0];
            const blindedSig = sigData.C_;
            const message = secrets[i][1];
            const C_ = nobleSecp256k1.Point.fromCompressedHex(hexToBytes(blindedSig));
            let amtPubkey = pubkeys[amount];
            amtPubkey = nobleSecp256k1.Point.fromCompressedHex(hexToBytes(amtPubkey));
            const { C } = message.unblindSignature(C_, amtPubkey);
            const compressedC = nobleSecp256k1.Point.fromHex(blindSigJS.ecPointToHex(C)).toHex(true);
            const utxo = {
                id,
                amount,
                secret,
                C: compressedC,
            };
            utxosToReturn.push(utxo);
        }
        return utxosToReturn;
    };

    // Get Lightning Network Invoice
    const getLNInvoice = async (mymint: string, fullAmount: number) => {
        const amountsToGet = decomposeAmount(fullAmount);
        amountsToGet.sort();
        const postData = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: fullAmount, unit: 'sat' }),
        };
        let invoiceData = await fetch(`${mymint}/v1/mint/quote/bolt11`, postData);
        invoiceData = await invoiceData.json();
        return invoiceData;
    };

    // Check Lightning Network Invoice
    const checkLNInvoice = async (mymint: string, invoiceData: any, appPubkey: string) => {
        if (typeof invoiceData !== 'object') {
            // Process an invoice not known by the mint
            const pmthash = getInvoicePmthash(invoiceData);
            return !!nostrState.nwc_info[appPubkey].tx_history[pmthash].settled_at;
        }
        const pmthash = getInvoicePmthash(invoiceData.request);
        const url = `${mymint}/v1/mint/quote/bolt11/${invoiceData.quote}`;
        let isPaidInfo = await fetch(url);
        const info = await isPaidInfo.json();
        const isPaid = info?.paid;
        if (isPaid) nostrState.nwc_info[appPubkey].tx_history[pmthash].paid = true;
        return isPaid;
    };

    // // Get Invoice Payment Hash
    const getInvoicePmthash = (invoice: string) => {
        const decoded = bolt11.decode(invoice);
        for (let tag of decoded.tags) {
            if (tag.tagName === 'payment_hash') return tag.data.toString();
        }
        return '';
    };


    // Create NWC Connection
    const createNWCConnection = async () => {
        const mint = prompt('Pick a Cashu mint from bitcoinmints.com (pick one that supports NUTS not MODULES) and enter its URL here');
        if (!mint) return;
        if (mint.includes('...')) return alert('Your mint URL is invalid. Ensure you clicked the clipboard icon on bitcoinmints.com -- if you just highlight + copy, it won\'t work.');
        if (mint.startsWith('fed1')) return alert('Your mint is not a Cashu mint. Please try again.');
        if (!mint.startsWith('https://')) return alert('Your mint is not a Cashu mint URL. Please try again.');
        nostrState.mymint = mint;
        await createNWCConnectionLogic();
    };

    // Actual logic to create NWC connection
    const createNWCConnectionLogic = async () => {
        if (!Object.keys(nostrState.nwc_info).length) {
            const relay = "wss://nostrue.com";
            const appPrivkey = super_nostr.bytesToHex(nobleSecp256k1.utils.randomPrivateKey());
            const appPubkey = nobleSecp256k1.getPublicKey(appPrivkey, true).substring(2);
            const userSecret = super_nostr.bytesToHex(nobleSecp256k1.utils.randomPrivateKey());
            const userPubkey = nobleSecp256k1.getPublicKey(userSecret, true).substring(2);
            const nwcString = `nostr+walletconnect://${appPubkey}?relay=${relay}&secret=${userSecret}`;
            nostrState.nwc_info[appPubkey] = {
                mymint: nostrState.mymint,
                nwc_string: nwcString,
                app_privkey: appPrivkey,
                app_pubkey: appPubkey,
                user_secret: userSecret,
                user_pubkey: userPubkey,
                relay,
                balance: 0,
                tx_history: {},
            };
            console.log(nwcString);
        }
        await nostrLoop();
    };

    // Nostr Loop
    const nostrLoop = async () => {
        const relay = "wss://nostrue.com";
        nostrState.socket = new WebSocket(relay);
        nostrState.socket.addEventListener('message', handleEvent);
        nostrState.socket.addEventListener('open', () => { listen(nostrState.socket); });

        let connectionFailure = false;

        const innerLoop = async (tries = 0) => {
            if (connectionFailure) return alert('Your connection to Nostr failed and could not be restarted. Please refresh the page.');
            if (nostrState.socket.readyState === 1) {
                await super_nostr.waitSomeSeconds(1);
                return innerLoop();
            }
            if (nostrState.socket.readyState === 0 && !tries) {
                await super_nostr.waitSomeSeconds(1);
                return innerLoop(1);
            }
            if (nostrState.socket.readyState === 0 && tries) {
                connectionFailure = true;
                return;
            }
            nostrState.socket.close();
            await super_nostr.waitSomeSeconds(1);
            nostrState.socket = new WebSocket(relay);
            nostrState.socket.addEventListener('message', handleEvent);
            nostrState.socket.addEventListener('open', () => { listen(nostrState.socket); });
            await innerLoop();
        };

        await innerLoop();
        await nostrLoop();
    };

    // Listen to Nostr events
    const listen = async (socket: any) => {
        const subId = super_nostr.bytesToHex(nobleSecp256k1.utils.randomPrivateKey()).substring(0, 16);
        const filter = {
            kinds: [23194],
            since: Math.floor(Date.now() / 1000),
            '#p': [Object.keys(nostrState.nwc_info)[0]],
        };
        const subscription = ['REQ', subId, filter];
        socket.send(JSON.stringify(subscription));

        const state = nostrState.nwc_info[Object.keys(nostrState.nwc_info)[0]];
        const msg = 'pay_invoice get_balance make_invoice lookup_invoice list_transactions get_info';
        const event = await super_nostr.prepEvent(state.app_privkey, msg, 13194);
        return super_nostr.sendEvent(event, socket);
    };

    // Handle Nostr events
    const handleEvent = async (message: any) => {
        const [type, subId, event] = JSON.parse(message.data);
        const { kind, content } = event || {};
        if (!event || event === true) return;
        const appPubkey = getRecipientFromNostrEvent(event);
        if (!(appPubkey in nostrState.nwc_info)) return;
        const state = nostrState.nwc_info[appPubkey];
        if (event.pubkey !== state.user_pubkey) return;

        let command = super_nostr.decrypt(state.app_privkey, event.pubkey, content);
        const mymint = nostrState.mymint;

        try {
            command = JSON.parse(command);
            // Handle different command types (e.g., get_info, get_balance, make_invoice, etc.)
            // Include logic for each type similar to the original implementation.
        } catch (e) {
            // Error handling
        }
    };

    // Helper function to get the recipient from Nostr event
    const getRecipientFromNostrEvent = (event: any) => {
        for (let tag of event.tags) {
            if (tag && tag[0] === 'p') return tag[1];
        }
        return null;
    };

    return {
        getBalance,
        hexToBytes,
        bytesToHex,
        decomposeAmount,
        getUtxosAndSecrets,
        getLNInvoice,
        checkLNInvoice,
        // getInvoicePmthash,
        // sendLN,
        createNWCConnection,
        utxos,
        nostrState,
    };
};

export default useBankify;
