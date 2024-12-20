import { $ } from "../util";

const OUTPUT_TYPES = ["progress","text","formatted","file","keypair","none","error"];

let outputData:any;

export function setOutput(type:"progress"|"text"|"formatted"|"file"|"keypair"|"none"|"error",data:any=undefined){
    for(const t of OUTPUT_TYPES){
        ($(`#output-${t}`) as HTMLDivElement).hidden = true;
        if(t == type){
            ($(`#output-${t}`) as HTMLDivElement).hidden = false;
        }
    }

    outputData = data;

    switch(type){
        case "progress":
            break;
        case "text":
            ($("#output-text-content") as HTMLTextAreaElement).value = data;
            break;
        case "formatted":
            $("#outbound-formatted-preview").shadowRoot.innerHTML = data;
            break;
        case "file":
            ($("#output-file-size") as HTMLSpanElement).innerText = data.data.byteLength.toString();
            
            break;
        case "keypair":
            console.log(outputData)
            break;
        case "none":
            break;
        case "error":
            ($("#output-error-contents") as HTMLPreElement).innerText = data;
            break;
    }
}

export function initOutputs(){
    $("#output-file-download").addEventListener("click",function(){
        let blob = new Blob([outputData.data]);
        let objurl = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = objurl;
        a.download = outputData.filename || "download.bin";
        a.click();
        URL.revokeObjectURL(objurl);
    });
    $("#output-keypair-downloadpublic").addEventListener("click",function(){
        let blob = new Blob([JSON.stringify(outputData.public)]);
        let objurl = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = objurl;
        a.download = "key.public";
        a.click();
        URL.revokeObjectURL(objurl);
    });
    $("#output-keypair-downloadsecret").addEventListener("click",function(){
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