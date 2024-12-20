
import { initInbound } from "./sections/inbound";
import { initKeypair } from "./sections/keypair";
import { initOutbound } from "./sections/outbound";
import { initOutputs } from "./sections/output";
import { $ , $a } from "./util";



const SCREENS = ["outbound","inbound","keypair"];
const SCREENMAP = {
    "Encrypt an outbound message":"outbound",
    "Decrypt an inbound message":"inbound",
    "Generate a public-private key pair":"keypair"
}



function initSectionHeadings():void{
    const sectionHeadings = $a("section .heading");
    for(const heading of sectionHeadings){
        heading.addEventListener("click",function(){
            const p = this.parentNode;
            const content = $(".content",p) as HTMLDivElement;
            content.hidden = !content.hidden;

            if(content.hidden){
                this.style.borderBottom = "1px dotted grey"
            } else {
                this.style.borderBottom = "";
            }
        })
    }
}

function initScreens():void{
    const selector = $("#config-intent");
    selector.addEventListener("change",function(){
        let curScreen = SCREENMAP[this.value];
        for(const screen of SCREENS){
            ($(`#${screen}`) as HTMLElement).hidden = true;
            if(screen === curScreen){
                ($(`#${screen}`) as HTMLElement).hidden = false;
            }
        }
    })
}

function initPreviews():void{
    const previews = $a(".preview");
    for(const preview of previews){
        preview.attachShadow({mode:"open"});
    }
}


export function initUI():void{
    initPreviews();
    initSectionHeadings();
    initScreens();
    initOutbound();
    initInbound();
    initOutputs();
    initKeypair();
    
}