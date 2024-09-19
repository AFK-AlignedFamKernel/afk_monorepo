// Import necessary dependencies
import { useEffect, useState } from 'react';
import Script from 'next/script';
import useBankify from './useBankify';

const NwcMint: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);
    const [nwcString, setNwcString] = useState<string | null>(null);
    const [invoice, setInvoice] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    const [connectionId, setConnectionId] = useState<string | undefined>()
    // Reference to bankify and super_nostr scripts which would be added to the window object
    const bankify = (typeof window !== 'undefined' && (window as any).bankify) || {};

    // const {
    //     getBalance,
    //     getLNInvoice,
    //     checkLNInvoice,
    //     createNWCConnection,
    //     addUtxo,
    //     utxos,
    //     nostrState,
    // } = useBankify();

    const super_nostr = (typeof window !== 'undefined' && (window as any).super_nostr) || {};
    const destroyConnection = (connectionId: string) => {
        delete bankify.state.nostr_state.nwc_info[connectionId];
        localStorage['nwc_server_state'] = JSON.stringify(bankify.state.nostr_state.nwc_info);
        window.location.reload();
    };
    useEffect(() => {
        const showStringLoop = async () => {
            if (!Object.keys(bankify.state?.nostr_state?.nwc_info || {}).length) {
                await super_nostr.waitSomeSeconds(1);
                setIsConnected(false);
                showStringLoop();
                return;
            }

            const connectionId = Object.keys(bankify.state.nostr_state.nwc_info)[0];
            setConnectionId(connectionId)
            const nwcString = bankify.state.nostr_state.nwc_info[connectionId].nwc_string;
            bankify.state.mymint = bankify.state.nostr_state.nwc_info[connectionId].mymint;
            setNwcString(nwcString);
            setIsConnected(true);

            if (!bankify.state.nostr_state.socket) bankify.createNWCconnection();
            const waitForConnection = async () => {
                if (bankify.state.nostr_state.socket.readyState === 1) return;
                await super_nostr.waitSomeSeconds(1);
                return waitForConnection();
            };
            await waitForConnection();

            if (bankify.state.utxos.length && !balance) setBalance(bankify.getBalance());
        };



        showStringLoop();

        if (localStorage['nwc_server_state']) {
            bankify.state.nostr_state.nwc_info = JSON.parse(localStorage['nwc_server_state']);
        }
        if (localStorage['cashu_utxos']) {
            bankify.state.utxos = JSON.parse(localStorage['cashu_utxos']);
        }

        const saveState = async () => {
            localStorage['nwc_server_state'] = JSON.stringify(bankify.state.nostr_state.nwc_info);
            localStorage['cashu_utxos'] = JSON.stringify(bankify.state.utxos);
            await super_nostr.waitSomeSeconds(1);
            saveState();
        };
        saveState();
    }, []);

    const handleCreateNWCConnection = () => {
        const mint = prompt('Pick a cashu mint from bitcoinmints.com (pick one that supports NUTS not MODULES) and enter its url here');
        if (!mint) return;
        if (mint.includes('...')) return alert('your mint url is invalid, be sure you clicked the clipboard icon on bitcoinmints.com -- if you just highlight + copy it won\'t work');
        if (mint.startsWith('fed1')) return alert('your mint is not a cashu mint, if you look on bitcoinmints.com you\'ll see you accidentally clicked on that supports MODULES and you need one that supports NUTS. Please try again');
        if (!mint.startsWith('https://')) return alert('your mint is not a cashu mint url, you must copy the mint\'s url and nothing else. Please try again');
        bankify.state.mymint = mint;
        bankify.createNWCconnection();
    };

    const handleSend = () => {
        bankify.sendLN();
    };

    const handleReceive = async () => {
        setInvoice('loading...');
        const invoice = await bankify.receiveLN();
        setInvoice(invoice);
    };

    return (
        <>
            {/* Include external scripts */}
            <Script src="https://supertestnet.github.io/bitcoin-chess/js/bolt11.js" strategy="beforeInteractive" />
            <Script src="https://supertestnet.github.io/blind-sig-js/blindSigJS.js" strategy="beforeInteractive" />
            <Script src="https://supertestnet.github.io/bankify/super_nostr.js" strategy="beforeInteractive" />
            <Script src="https://supertestnet.github.io/bankify/bankify.js" strategy="beforeInteractive" />
            <Script src="https://bundle.run/browserify-cipher@1.0.1" strategy="beforeInteractive" />
            <Script src="https://bundle.run/noble-secp256k1@1.2.14" strategy="beforeInteractive" />

            <style jsx>{`
        * {
          box-sizing: border-box;
          font-size: 1.15rem;
          font-family: Arial, sans-serif;
        }
        html {
          max-width: 800px;
          padding: 3rem 1rem;
          margin: auto;
          line-height: 1.25;
          padding: 0;
        }
        body {
          margin: 3rem 1rem;
        }
        h1 {
          font-size: 2rem;
        }
        h2 {
          font-size: 1.5rem;
        }
        input {
          line-height: 1.25;
          width: 100%;
          height: 1.8rem;
          font-size: 1.15rem;
          border: 1px solid grey;
        }
        .hidden {
          display: none !important;
        }
        .invoice_box {
          border: 1px solid black;
          color: black;
          font-family: monospace;
          padding: 0.5rem;
          max-width: 15rem;
          word-wrap: break-word;
        }
      `}</style>

            <center><h2 className="balance">{balance}</h2></center>
            <center className={`send_and_receive_btns ${!isConnected ? 'hidden' : ''}`}>
                <button className="send" onClick={handleSend}>Send</button>
                <button className="receive" onClick={handleReceive}>Receive</button>
            </center>
            <center>
                <p className={`invoice_box ${!invoice ? 'hidden' : ''}`}>{invoice}</p>
                {!isConnected ? <p className="checking_connection">Checking for nwc connection...</p> : null}
                <div className={`nwc_btns ${isConnected ? 'hidden' : ''}`}>
                    <br />
                    <button className="create_nwc_connection" onClick={handleCreateNWCConnection}>Create NWC connection</button>
                    <br />
                </div>
                <div className="nwc_string_div">
                    {nwcString && (
                        <>
                            <p>Here is your NWC string:</p>
                            <p style={{ border: '1px solid black', backgroundColor: '#aaaaaa', color: 'black', fontFamily: 'monospace', padding: '0.5rem', maxWidth: '15rem', wordWrap: 'break-word' }}>
                                {nwcString}
                            </p>
                            <p><button onClick={() => connectionId && destroyConnection(connectionId)}>Destroy this connection</button></p>
                        </>
                    )}
                </div>
            </center>
        </>
    );
};

export default NwcMint;
