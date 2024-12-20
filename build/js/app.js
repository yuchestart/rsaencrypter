define("encryption", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateKeyPair = generateKeyPair;
    exports.saveKey = saveKey;
    exports.loadPublicKey = loadPublicKey;
    exports.loadPrivateKey = loadPrivateKey;
    exports.encryptBytes = encryptBytes;
    exports.decryptBytes = decryptBytes;
    exports.encryptText = encryptText;
    exports.decryptText = decryptText;
    async function generateKeyPair() {
        const keyPair = await window.crypto.subtle.generateKey({
            "name": "RSA-OAEP",
            "modulusLength": 4096,
            "publicExponent": new Uint8Array([1, 0, 1]),
            "hash": "SHA-256"
        }, true, ["encrypt", "decrypt"]);
        return keyPair;
    }
    async function saveKey(key) {
        return await window.crypto.subtle.exportKey("jwk", key);
    }
    async function loadPublicKey(key) {
        return await window.crypto.subtle.importKey("jwk", key, {
            "name": "RSA-OAEP",
            "hash": "SHA-256"
        }, true, ["encrypt"]);
    }
    async function loadPrivateKey(key) {
        return await window.crypto.subtle.importKey("jwk", key, {
            "name": "RSA-OAEP",
            "hash": "SHA-256"
        }, true, ["decrypt"]);
    }
    async function encryptBytes(key, bytes) {
        return await window.crypto.subtle.encrypt({
            "name": "RSA-OAEP"
        }, key, bytes);
    }
    async function decryptBytes(key, encrypted) {
        return await window.crypto.subtle.decrypt({
            "name": "RSA-OAEP"
        }, key, encrypted);
    }
    async function encryptText(key, text) {
        let encoder = new TextEncoder();
        let bytes = encoder.encode(text);
        return await encryptBytes(key, bytes);
    }
    async function decryptText(key, encrypted) {
        let decrypted = await decryptBytes(key, encrypted);
        console.log(decrypted);
        let textdecoder = new TextDecoder();
        return textdecoder.decode(decrypted);
    }
});
define("util", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.$ = $;
    exports.$a = $a;
    function $(query, parent = document) {
        return parent.querySelector(query);
    }
    function $a(query, parent = document) {
        return parent.querySelectorAll(query);
    }
});
define("sections/output", ["require", "exports", "util"], function (require, exports, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setOutput = setOutput;
    exports.initOutputs = initOutputs;
    const OUTPUT_TYPES = ["progress", "text", "formatted", "file", "keypair", "none", "error"];
    let outputData;
    function setOutput(type, data = undefined) {
        for (const t of OUTPUT_TYPES) {
            (0, util_1.$)(`#output-${t}`).hidden = true;
            if (t == type) {
                (0, util_1.$)(`#output-${t}`).hidden = false;
            }
        }
        outputData = data;
        switch (type) {
            case "progress":
                break;
            case "text":
                (0, util_1.$)("#output-text-content").value = data;
                break;
            case "formatted":
                (0, util_1.$)("#outbound-formatted-preview").shadowRoot.innerHTML = data;
                break;
            case "file":
                (0, util_1.$)("#output-file-size").innerText = data.data.byteLength.toString();
                break;
            case "keypair":
                console.log(outputData);
                break;
            case "none":
                break;
            case "error":
                (0, util_1.$)("#output-error-contents").innerText = data;
                break;
        }
    }
    function initOutputs() {
        (0, util_1.$)("#output-file-download").addEventListener("click", function () {
            let blob = new Blob([outputData.data]);
            let objurl = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = objurl;
            a.download = outputData.filename || "download.bin";
            a.click();
            URL.revokeObjectURL(objurl);
        });
        (0, util_1.$)("#output-keypair-downloadpublic").addEventListener("click", function () {
            let blob = new Blob([JSON.stringify(outputData.public)]);
            let objurl = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = objurl;
            a.download = "key.public";
            a.click();
            URL.revokeObjectURL(objurl);
        });
        (0, util_1.$)("#output-keypair-downloadsecret").addEventListener("click", function () {
            let blob = new Blob([JSON.stringify(outputData.secret)]);
            let objurl = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = objurl;
            a.download = "key.private";
            a.click();
            URL.revokeObjectURL(objurl);
        });
        setOutput("none");
    }
});
define("sections/inbound", ["require", "exports", "util", "sections/output", "encryption"], function (require, exports, util_2, output_1, encryption_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initInbound = initInbound;
    let bodyType = "file";
    const BODY_TYPES = {
        "Plaintext(copied and pasted)": "plaintext",
        "File(downloaded)": "file"
    };
    const BODY_TYPE_CLASSNAMES = ["plaintext", "file"];
    const VECTORS = {
        "Text": "text",
        "Formatted/HTML/Markdown": "text",
        "File": "binary"
    };
    const VECTOR_TYPES = {
        "Text": "text",
        "Formatted/HTML/Markdown": "formatted",
        "File": "binary"
    };
    let filecontents;
    let privateKey;
    async function loadKey() {
        let status = (0, util_2.$)("#inbound-secretkeystatus");
        status.classList.remove("failure", "success");
        try {
            let fileInput = (0, util_2.$)("#inbound-secretkeyfile");
            let files = fileInput.files;
            if (files.length === 0)
                return;
            let jwk = JSON.parse(await files[0].text());
            privateKey = (await (0, encryption_1.loadPrivateKey)(jwk));
            status.innerText = files[0].name;
            status.classList.add("success");
        }
        catch (e) {
            console.error(e);
            status.classList.add("failure");
            status.innerText = "Load failed.";
        }
    }
    async function loadFile() {
        let status = (0, util_2.$)("#inbound-file-status");
        status.classList.remove("success", "failure");
        try {
            let files = (0, util_2.$)("#inbound-file-input").files;
            if (files.length === 0)
                return;
            filecontents = await files[0].arrayBuffer();
            (0, util_2.$)("#inbound-file-size").innerText = files[0].size.toString();
            status.classList.add("success");
            status.innerText = files[0].name;
        }
        catch (e) {
            console.error(e);
            status.classList.add("failure");
            status.innerText = "Load failed";
        }
    }
    async function decrypt() {
        try {
            (0, output_1.setOutput)("progress");
            let bytesToDecrypt;
            if (bodyType == "plaintext") {
                let stuff = atob((0, util_2.$)("#inbound-plaintext-input").value);
                let bytes = new Uint8Array(stuff.length);
                for (let i = 0; i < stuff.length; i++) {
                    bytes[i] = stuff.charCodeAt(i);
                }
                bytesToDecrypt = bytes.buffer;
            }
            else if (bodyType == "file") {
                bytesToDecrypt = filecontents;
            }
            console.log(bytesToDecrypt);
            let decrypted;
            let vector = VECTORS[(0, util_2.$)("#inbound-outputoverridetype").value];
            let vectorType = VECTOR_TYPES[(0, util_2.$)("#inbound-outputoverridetype").value];
            if (vector == "text") {
                decrypted = await (0, encryption_1.decryptText)(privateKey, bytesToDecrypt);
            }
            else if (vector == "binary") {
                decrypted = await (0, encryption_1.decryptBytes)(privateKey, bytesToDecrypt);
            }
            if (vectorType == "text") {
                (0, output_1.setOutput)("text", decrypted);
            }
            else if (vectorType == "formatted") {
                (0, output_1.setOutput)("formatted", decrypted);
            }
            else if (vectorType == "binary") {
                (0, output_1.setOutput)("file", {
                    "filename": "message.decrypted",
                    "data": decrypted
                });
            }
        }
        catch (e) {
            console.error(e);
            (0, output_1.setOutput)("error", e.stack);
        }
    }
    function initInbound() {
        (0, util_2.$)("#inbound-secretkeyload").addEventListener("click", loadKey);
        (0, util_2.$)("#inbound-file-load").addEventListener("click", loadFile);
        (0, util_2.$)(".action", (0, util_2.$)("#inbound.screen")).addEventListener("click", decrypt);
    }
});
define("sections/keypair", ["require", "exports", "encryption", "util", "sections/output"], function (require, exports, encryption_2, util_3, output_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initKeypair = initKeypair;
    function initKeypair() {
        (0, util_3.$)(".action", (0, util_3.$)("#keypair.screen")).addEventListener("click", async function () {
            const kp = await (0, encryption_2.generateKeyPair)();
            (0, output_2.setOutput)("keypair", {
                public: await (0, encryption_2.saveKey)(kp.publicKey),
                secret: await (0, encryption_2.saveKey)(kp.privateKey)
            });
        });
    }
});
define("sections/outbound", ["require", "exports", "encryption", "util", "sections/output"], function (require, exports, encryption_3, util_4, output_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initOutbound = initOutbound;
    let publicKey;
    let messageType = "textmessage";
    let messageTypeClassNames = {
        "Plaintext": "textmessage",
        "HTML": "textmessage",
        "Markdown": "textmessage",
        "File": "file"
    };
    let messageTypeAllClass = ["textmessage", "file"];
    let filecontents;
    async function loadKey() {
        let status = (0, util_4.$)("#outbound-publickeystatus");
        status.classList.remove("failure", "success");
        try {
            let fileInput = (0, util_4.$)("#outbound-publickeyfile");
            let files = fileInput.files;
            if (files.length === 0)
                return;
            let jwk = JSON.parse(await files[0].text());
            publicKey = await (0, encryption_3.loadPublicKey)(jwk);
            status.innerText = (files[0].name);
            status.classList.add("success");
        }
        catch (e) {
            console.error(e);
            status.classList.add("failure");
            status.innerText = "Load failed.";
        }
    }
    async function loadFile() {
        let status = (0, util_4.$)("#outbound-file-status");
        status.classList.remove("success", "failure");
        try {
            let files = (0, util_4.$)("#outbound-file-input").files;
            if (files.length === 0)
                return;
            let file = files[0];
            (0, util_4.$)("#outbound-file-name").innerText = file.name;
            (0, util_4.$)("#outbound-file-size").innerText = file.size.toString();
            filecontents = await file.arrayBuffer();
            status.classList.add("success");
            status.innerText = (file.name);
        }
        catch (e) {
            console.error(e);
            status.classList.add("failure");
            status.innerText = "Load failed";
        }
    }
    async function encryptFiles() {
        try {
            (0, output_3.setOutput)("progress");
            console.log(filecontents);
            let encryptedBytes = messageType == "file" ?
                await (0, encryption_3.encryptBytes)(publicKey, filecontents) :
                await (0, encryption_3.encryptText)(publicKey, (0, util_4.$)("#outbound-textmessage-input").value);
            console.log(encryptedBytes);
            let messageVector = "file";
            switch (messageVector) {
                case "text":
                    let contents = btoa(((x) => { let r = ""; for (let i = 0; i < x.byteLength; i++) {
                        r += String.fromCharCode(x[i]);
                    } return r; })(new Uint8Array(encryptedBytes)));
                    console.log(contents);
                    (0, output_3.setOutput)("text", contents);
                    break;
                case "file":
                    (0, output_3.setOutput)("file", {
                        "data": encryptedBytes,
                        "filename": "message.encrypted"
                    });
                    break;
            }
        }
        catch (e) {
            console.error(e);
            (0, output_3.setOutput)("error", e.stack);
        }
    }
    function initOutbound() {
        (0, util_4.$)("#outbound-publickeyload").addEventListener("click", loadKey);
        (0, util_4.$)("#outbound-messagetype").addEventListener("change", function () {
            for (const type of messageTypeAllClass) {
                (0, util_4.$)(`#outbound-${type}`).hidden = true;
                if (type == messageTypeClassNames[this.value]) {
                    (0, util_4.$)(`#outbound-${type}`).hidden = false;
                }
            }
            if (messageTypeClassNames[this.value] == "textmessage") {
                messageType = "textmessage";
                (0, util_4.$)(`#outbound-textmessage-preview`).hidden = this.value == "Plaintext";
                (0, util_4.$)(`#outbound-textmessage-updatepreviewcontainer`).hidden = this.value == "Plaintext";
            }
            else {
                messageType = "file";
            }
        });
        (0, util_4.$)("#outbound-file-load").addEventListener("click", loadFile);
        (0, util_4.$)(".action", (0, util_4.$)("#outbound")).addEventListener("click", encryptFiles);
    }
});
define("ui", ["require", "exports", "sections/inbound", "sections/keypair", "sections/outbound", "sections/output", "util"], function (require, exports, inbound_1, keypair_1, outbound_1, output_4, util_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initUI = initUI;
    const SCREENS = ["outbound", "inbound", "keypair"];
    const SCREENMAP = {
        "Encrypt an outbound message": "outbound",
        "Decrypt an inbound message": "inbound",
        "Generate a public-private key pair": "keypair"
    };
    function initSectionHeadings() {
        const sectionHeadings = (0, util_5.$a)("section .heading");
        for (const heading of sectionHeadings) {
            heading.addEventListener("click", function () {
                const p = this.parentNode;
                const content = (0, util_5.$)(".content", p);
                content.hidden = !content.hidden;
                if (content.hidden) {
                    this.style.borderBottom = "1px dotted grey";
                }
                else {
                    this.style.borderBottom = "";
                }
            });
        }
    }
    function initScreens() {
        const selector = (0, util_5.$)("#config-intent");
        selector.addEventListener("change", function () {
            let curScreen = SCREENMAP[this.value];
            for (const screen of SCREENS) {
                (0, util_5.$)(`#${screen}`).hidden = true;
                if (screen === curScreen) {
                    (0, util_5.$)(`#${screen}`).hidden = false;
                }
            }
        });
    }
    function initPreviews() {
        const previews = (0, util_5.$a)(".preview");
        for (const preview of previews) {
            preview.attachShadow({ mode: "open" });
        }
    }
    function initUI() {
        initPreviews();
        initSectionHeadings();
        initScreens();
        (0, outbound_1.initOutbound)();
        (0, inbound_1.initInbound)();
        (0, output_4.initOutputs)();
        (0, keypair_1.initKeypair)();
    }
});
define("main", ["require", "exports", "ui"], function (require, exports, ui_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    async function main() {
        (0, ui_1.initUI)();
    }
    window.addEventListener("load", main);
});
define("manager", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.privateKeyName = exports.privateKey = void 0;
    exports.setPrivateKey = setPrivateKey;
    exports.setPrivateKeyName = setPrivateKeyName;
    exports.privateKeyName = "None";
    function setPrivateKey(v) {
        exports.privateKey = v;
    }
    function setPrivateKeyName(v) {
        exports.privateKeyName = v;
    }
});
