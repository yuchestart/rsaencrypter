import { encryptBytes, encryptText, loadPublicKey } from "../encryption";
import { $ } from "../util";
import { setOutput } from "./output";

let publicKey: CryptoKey;
let messageType = "textmessage";
let messageTypeClassNames = {
    "Plaintext": "textmessage",
    "HTML": "textmessage",
    "Markdown": "textmessage",
    "File": "file"
}
let messageTypeAllClass = ["textmessage", "file"];
let filecontents: ArrayBuffer;


async function loadKey() {
    let status = ($("#outbound-publickeystatus") as HTMLSpanElement);
    status.classList.remove("failure", "success");
    try {
        let fileInput = $("#outbound-publickeyfile") as HTMLInputElement;
        let files = fileInput.files;
        if (files.length === 0)
            return;
        let jwk = JSON.parse(await files[0].text());
        publicKey = await loadPublicKey(jwk);
        status.innerText = (files[0].name);
        status.classList.add("success");
    } catch (e) {
        console.error(e);
        status.classList.add("failure");
        status.innerText = "Load failed.";
    }
}

async function loadFile() {
    let status = $("#outbound-file-status") as HTMLSpanElement;
    status.classList.remove("success", "failure");
    try {
        let files = ($("#outbound-file-input") as HTMLInputElement).files;
        if (files.length === 0)
            return;
        let file = files[0];
        ($("#outbound-file-name") as HTMLSpanElement).innerText = file.name;
        ($("#outbound-file-size") as HTMLSpanElement).innerText = file.size.toString();
        filecontents = await file.arrayBuffer();
        status.classList.add("success");
        status.innerText = (file.name);
    } catch (e) {
        console.error(e);
        status.classList.add("failure");
        status.innerText = "Load failed"
    }
}

async function encryptFiles() {
    try {
        setOutput("progress");
        console.log(filecontents);
        let encryptedBytes: ArrayBuffer =
            messageType == "file" ?
                await encryptBytes(publicKey, filecontents) :
                await encryptText(
                    publicKey,
                    ($("#outbound-textmessage-input") as HTMLTextAreaElement).value
                );
        console.log(encryptedBytes)
        let messageVector = "file";
        switch (messageVector) {
            case "text":
                let contents = btoa(((x)=>{let r="";for(let i=0;i<x.byteLength;i++){r+=String.fromCharCode(x[i])}return r;})(new Uint8Array(encryptedBytes)));
                console.log(contents)
                setOutput("text", contents);
                break;
            case "file":
                setOutput("file", {
                    "data": encryptedBytes,
                    "filename": "message.encrypted"
                });
                break;
        }
    } catch (e) {
        console.error(e);
        setOutput("error", e.stack);
    }
}

export function initOutbound() {
    $("#outbound-publickeyload").addEventListener("click", loadKey);
    $("#outbound-messagetype").addEventListener("change", function () {
        for (const type of messageTypeAllClass) {
            ($(`#outbound-${type}`) as HTMLDivElement).hidden = true;
            if (type == messageTypeClassNames[this.value]) {
                ($(`#outbound-${type}`) as HTMLDivElement).hidden = false;
            }
        }
        if (messageTypeClassNames[this.value] == "textmessage") {
            messageType = "textmessage";
            ($(`#outbound-textmessage-preview`) as HTMLDivElement).hidden = this.value == "Plaintext";
            ($(`#outbound-textmessage-updatepreviewcontainer`) as HTMLButtonElement).hidden = this.value == "Plaintext";
        } else {
            messageType = "file";
        }
    });
    $("#outbound-file-load").addEventListener("click", loadFile);
    $(".action", $("#outbound")).addEventListener("click", encryptFiles);
}