export function $(query:string,parent:Element|Document=document):Element{
    return parent.querySelector(query);
}

export function $a(query:string,parent:Element|Document=document):NodeListOf<Element>{
    return parent.querySelectorAll(query);
}