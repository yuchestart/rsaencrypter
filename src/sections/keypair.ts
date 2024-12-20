import { generateKeyPair, saveKey } from "../encryption"
import { $ } from "../util"
import { setOutput } from "./output"

export function initKeypair(){
    
    $(".action",$("#keypair.screen")).addEventListener("click",async function(){
        const kp = await generateKeyPair();
        setOutput("keypair",{
            public:await saveKey(kp.publicKey),
            secret:await saveKey(kp.privateKey)
        });
    })
}