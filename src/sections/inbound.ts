import { $ } from "../util";
import { setOutput } from "./output";
import { decryptBytes, decryptText, loadPrivateKey } from "../encryption";

let bodyType: string = "file";
const BODY_TYPES = {
    "Plaintext(copied and pasted)": "plaintext",
    "File(downloaded)": "file"
}
const BODY_TYPE_CLASSNAMES = ["plaintext", "file"];
const VECTORS = {
    "Text":"text",
    "Formatted/HTML/Markdown":"text",
    "File":"binary"
}

const VECTOR_TYPES = {
    "Text":"text",
    "Formatted/HTML/Markdown":"formatted",
    "File":"binary"
}

let filecontents: ArrayBuffer;

let privateKey:CryptoKey;

async function loadKey() {
    let status = ($("#inbound-secretkeystatus") as HTMLSpanElement);
    status.classList.remove("failure","success");
    try {
        let fileInput = $("#inbound-secretkeyfile") as HTMLInputElement;
        let files = fileInput.files;
        if (files.length === 0)
            return;
        let jwk = JSON.parse(await files[0].text());
        privateKey = (await loadPrivateKey(jwk));
        status.innerText = files[0].name;
        status.classList.add("success");
    } catch (e) {
        console.error(e);
        status.classList.add("failure");
        status.innerText = "Load failed.";
    }
}

async function loadFile() {
    let status = $("#inbound-file-status") as HTMLSpanElement;
    status.classList.remove("success","failure");
    try {
        let files = ($("#inbound-file-input") as HTMLInputElement).files;
        if (files.length === 0)
            return;
        
        filecontents = await files[0].arrayBuffer();
        ($("#inbound-file-size") as HTMLSpanElement).innerText = files[0].size.toString();

        status.classList.add("success");
        status.innerText = files[0].name;
    } catch (e) {
        console.error(e);
        status.classList.add("failure");
        status.innerText = "Load failed";
    }
}

async function decrypt(){
    try{
        setOutput("progress");

        let bytesToDecrypt:ArrayBuffer;
        if(bodyType == "plaintext"){
            let stuff = atob(($("#inbound-plaintext-input") as HTMLTextAreaElement).value);
            let bytes = new Uint8Array(stuff.length);
            for(let i=0; i<stuff.length; i++){
                bytes[i] = stuff.charCodeAt(i);
            }
            bytesToDecrypt = bytes.buffer;
        } else if(bodyType == "file"){
            bytesToDecrypt = filecontents;
        }
        console.log(bytesToDecrypt);
        let decrypted:ArrayBuffer | string;
        let vector = VECTORS[($("#inbound-outputoverridetype") as HTMLSelectElement).value];
        let vectorType = VECTOR_TYPES[($("#inbound-outputoverridetype") as HTMLSelectElement).value];
        if(vector == "text"){
            decrypted = await decryptText(privateKey,bytesToDecrypt);
        } else if(vector == "binary"){
            decrypted = await decryptBytes(privateKey,bytesToDecrypt);
        }

        if(vectorType == "text"){
            setOutput("text",decrypted);
        } else if(vectorType == "formatted"){
            setOutput("formatted",decrypted);
        } else if(vectorType == "binary"){
            setOutput("file",{
                "filename":"message.decrypted",
                "data":decrypted
            })
        }
    }catch(e){
        console.error(e);
        setOutput("error",e.stack);
    }
}

export function initInbound() {
    
    ($("#inbound-secretkeyload") as HTMLButtonElement).addEventListener("click", loadKey);
    $("#inbound-file-load").addEventListener("click", loadFile);
    $(".action",$("#inbound.screen")).addEventListener("click",decrypt);
}