
export let privateKey:CryptoKey;

export let privateKeyName:string = "None";

export function setPrivateKey(v){
    privateKey = v;
}

export function setPrivateKeyName(v){
    privateKeyName = v;
}