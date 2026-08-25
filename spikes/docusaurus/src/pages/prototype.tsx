import React,{useEffect} from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import {useHistory,useLocation} from "@docusaurus/router";
import "./prototype.css";

const variants={A:"Tree + article",B:"Article-first",C:"Command palette"};
type Variant=keyof typeof variants;

export default function Prototype(){
  const location=useLocation();
  const history=useHistory();
  const params=new URLSearchParams(location.search);
  const candidate=params.get("variant")||"A";
  const variant:Variant=candidate in variants?candidate as Variant:"A";
  const keys=Object.keys(variants) as Variant[];
  const set=(next:Variant)=>history.replace({...location,search:`?variant=${next}`});
  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if(["INPUT","TEXTAREA"].includes((event.target as HTMLElement)?.tagName))return;
      const index=keys.indexOf(variant);
      if(event.key==="ArrowLeft")set(keys[(index+keys.length-1)%keys.length]);
      if(event.key==="ArrowRight")set(keys[(index+1)%keys.length]);
    };
    addEventListener("keydown",handler);
    return()=>removeEventListener("keydown",handler);
  },[variant]);
  const index=keys.indexOf(variant);
  return <Layout title="UI control prototype">
    <main className={`prototype variant-${variant}`}>
      <p className="eyebrow">V3 DEVELOPMENT DRAFT</p>
      <h1>Docusaurus BV shell control</h1>
      <p>Representative page used to measure how far BV-owned structure can replace framework defaults.</p>
      <Link className="button button--primary" to="/node-reference/bv-regional-prompt">Open node reference</Link>
    </main>
    {process.env.NODE_ENV!=="production"&&<div className="prototype-switcher">
      <button onClick={()=>set(keys[(index+keys.length-1)%keys.length])}>←</button>
      <span>{variant} — {variants[variant]}</span>
      <button onClick={()=>set(keys[(index+1)%keys.length])}>→</button>
    </div>}
  </Layout>;
}
