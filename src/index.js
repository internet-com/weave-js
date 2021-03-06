/* jshint esversion:6 */

import {KeyBase} from './keybase';
import {open} from './db';
import {Client} from './client';
import {loadJSON, pbToObj, weave} from './proto';

// makeSignatures signs the bytes and builds a proper StdSignature to append to a tx
function makeSignatures(sender, bz, chainID) {
    let {sig, seq} = sender.sign(bz, chainID);
    let std = weave.sigs.StdSignature.create({
        pubKey: sender.pubkey,
        signature: sig,
        sequence: seq
    });
    return [std];
}

// calculates sign bytes, creates a signature and returns serialized tx (as buffer)
// TODO: handle multi-sigs
function signTx(Tx, tx, sender, chainID) {
    let bz = Tx.encode(tx).finish();
    tx.signatures = makeSignatures(sender, bz, chainID);
    return Tx.encode(tx).finish();
}

// buildSendTx constructs a sendMsg to move tokens from the sender to rcpt
// Tx - the app-specific Tx wrapper. We assume they use StdSignature, 
//      and support sendMsg, but are quite flexible about the rest
// sender - KeyPair (from KeyBase) to send and sign the tx
// rcpt - address to receive the message
// amount - number of tokens to send (whole amount)
// currency - ticker of the tokens to send
// chainID - chainID to send on (included in tx signature)
function buildSendTx(Tx, sender, rcpt, amount, currency, chainID) {
    rcpt = Buffer.from(rcpt, 'hex');  // may be bytes or a hex string
    let msg = weave.cash.SendMsg.create({
        src: sender.addressBytes(),
        dest: rcpt,
        amount: weave.x.Coin.create({whole: amount, ticker: currency})
    });
    let tx = Tx.create({
        sendMsg: msg
    });
    return signTx(Tx, tx, sender, chainID);
}

exports.KeyBase = KeyBase;
exports.Client = Client;
exports.openDB = open;
exports.pbToObj = pbToObj;
exports.weave = weave;
exports.loadJSON = loadJSON;
exports.buildSendTx = buildSendTx;
exports.signTx = signTx;