export async function generateKeyPair(): Promise<CryptoKeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            "name": "RSA-OAEP",
            "modulusLength": 4096,
            "publicExponent": new Uint8Array([1, 0, 1]),
            "hash": "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );

    return keyPair;
}

export async function saveKey(key: CryptoKey): Promise<JsonWebKey> {
    return await window.crypto.subtle.exportKey(
        "jwk", key
    );
}

export async function loadPublicKey(key: JsonWebKey): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        "jwk", key, {
        "name": "RSA-OAEP",
        "hash": "SHA-256"
    }, true, ["encrypt"]
    )
}

export async function loadPrivateKey(key: JsonWebKey): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        "jwk", key, {
        "name": "RSA-OAEP",
        "hash": "SHA-256"
    }, true, ["decrypt"]
    )
}


export async function encryptBytes(key: CryptoKey, bytes: BufferSource): Promise<ArrayBuffer> {
    return await window.crypto.subtle.encrypt(
        {
            "name": "RSA-OAEP"
        },
        key,
        bytes
    );
}

export async function decryptBytes(key: CryptoKey, encrypted: BufferSource): Promise<ArrayBuffer> {
    return await window.crypto.subtle.decrypt(
        {
            "name": "RSA-OAEP"
        },
        key,
        encrypted
    );
}

export async function encryptText(key: CryptoKey, text:string): Promise<ArrayBuffer>{
    let encoder = new TextEncoder();
    let bytes = encoder.encode(text);
    return await encryptBytes(key,bytes);
}

export async function decryptText(key: CryptoKey, encrypted:ArrayBuffer): Promise<string>{
    let decrypted = await decryptBytes(key,encrypted);
    console.log(decrypted)
    let textdecoder = new TextDecoder();
    return textdecoder.decode(decrypted);
}