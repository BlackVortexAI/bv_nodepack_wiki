import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {MDXProvider} from "@mdx-js/react";
import {z} from "zod";
import Content, {meta} from "./content/node-reference.mdx";
import "./styles.css";

const Meta=z.object({title:z.string(),slug:z.string().startsWith("/"),category:z.string(),productStatus:z.string(),documentationStatus:z.enum(["draft","under-review","in-progress","complete","outdated"]),audience:z.string(),node:z.string(),appliesTo:z.string(),lastVerified:z.string()});
Meta.parse(meta);
const entries=[{title:"BV Regional Prompt",summary:"Author V3 regional documents",href:"#overview"},{title:"Minimal connections",summary:"Required V3 wiring",href:"#minimal-connections"},{title:"Known limitation",summary:"Development baseline caveat",href:"#known-limitation"}];
const components={StatusCallout:({children}:React.PropsWithChildren)=> <aside className="callout">{children}</aside>,AssetPlaceholder:(props:{id:string;role:string;subject:string})=><figure className="placeholder"><strong>{props.role}</strong><code>{props.id}</code><span>{props.subject}</span></figure>};
const variants={A:"Tree + article",B:"Article-first",C:"Command palette"} as const;
type Variant=keyof typeof variants;
function Switcher({value,onChange}:{value:Variant,onChange:(v:Variant)=>void}){const keys=Object.keys(variants) as Variant[];useEffect(()=>{const h=(e:KeyboardEvent)=>{if(["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName))return;const i=keys.indexOf(value);if(e.key==="ArrowLeft")onChange(keys[(i+keys.length-1)%keys.length]);if(e.key==="ArrowRight")onChange(keys[(i+1)%keys.length])};addEventListener("keydown",h);return()=>removeEventListener("keydown",h)},[value]);return <div className="switcher"><button onClick={()=>onChange(keys[(keys.indexOf(value)+2)%3])}>←</button><span>{value} — {variants[value]}</span><button onClick={()=>onChange(keys[(keys.indexOf(value)+1)%3])}>→</button></div>}
function App(){const params=new URLSearchParams(location.search);const initial=(params.get("variant")||"A") as Variant;const [variant,setVariant]=useState<Variant>(initial in variants?initial:"A");const [query,setQuery]=useState("");const results=useMemo(()=>entries.filter(x=>(x.title+" "+x.summary).toLowerCase().includes(query.toLowerCase())),[query]);const change=(v:Variant)=>{setVariant(v);history.replaceState(null,"",`?variant=${v}`)};return <MDXProvider components={components}><div className={`app variant-${variant}`}><header><b>BV NodePack</b><span>V3 documentation draft</span><input aria-label="Search documentation" placeholder="Search locally" value={query} onChange={e=>setQuery(e.target.value)}/></header><nav><strong>Node Guides</strong><a>Regional Prompting</a><a>Smart Pipes</a><strong>Node Reference</strong><a className="active">BV Regional Prompt</a><a>Internal Nodes</a></nav><main>{query?<section><h1>Search</h1>{results.map(x=><a key={x.href} href={x.href}><b>{x.title}</b><span>{x.summary}</span></a>)}</section>:<><div className="crumb">Node Reference / Regional Prompting / BV Regional Prompt</div><Content /></>}</main><aside className="toc"><b>On this page</b>{entries.map(x=><a key={x.href} href={x.href}>{x.title}</a>)}</aside></div>{import.meta.env.DEV&&<Switcher value={variant} onChange={change}/>}</MDXProvider>}

createRoot(document.getElementById("root")!).render(<App/>);
