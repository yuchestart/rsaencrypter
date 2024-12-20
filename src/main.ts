import { decryptText, encryptText, generateKeyPair, loadPrivateKey, loadPublicKey, saveKey } from "./encryption";
import { initUI } from "./ui";


export async function main():Promise<void>{
    initUI();
}


window.addEventListener("load",main);
