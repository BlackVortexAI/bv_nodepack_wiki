import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {VariantA, VariantB, VariantC} from "./variants";
import "./styles.css";

export type Variant = "A" | "B" | "C";
export type Page = "home" | "reference" | "guide";
export const variantNames: Record<Variant,string> = {A:"Workbench",B:"Atlas",C:"Index"};

function Switcher({variant,page,setVariant,setPage}:{variant:Variant;page:Page;setVariant:(v:Variant)=>void;setPage:(p:Page)=>void}) {
  const keys = Object.keys(variantNames) as Variant[];
  const index = keys.indexOf(variant);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT","TEXTAREA"].includes(target?.tagName) || target?.isContentEditable) return;
      if (event.key === "ArrowLeft") setVariant(keys[(index + 2) % 3]);
      if (event.key === "ArrowRight") setVariant(keys[(index + 1) % 3]);
    };
    addEventListener("keydown", handler);
    return () => removeEventListener("keydown", handler);
  }, [variant]);
  return <div className="prototype-switcher">
    <button onClick={() => setVariant(keys[(index + 2) % 3])} aria-label="Previous variant">←</button>
    <div><small>THROWAWAY VISUAL PROTOTYPE</small><b>{variant} — {variantNames[variant]}</b></div>
    <button onClick={() => setVariant(keys[(index + 1) % 3])} aria-label="Next variant">→</button>
    <i/><select value={page} onChange={e => setPage(e.target.value as Page)} aria-label="Prototype page">
      <option value="home">Home</option><option value="reference">Node Reference</option><option value="guide">Node Guide</option>
    </select>
  </div>;
}

function App() {
  const params = new URLSearchParams(location.search);
  const initialVariant = (params.get("variant") || "A") as Variant;
  const initialPage = (params.get("page") || "home") as Page;
  const [variant,setV] = useState<Variant>(initialVariant in variantNames ? initialVariant : "A");
  const [page,setP] = useState<Page>(["home","reference","guide"].includes(initialPage) ? initialPage : "home");
  const sync = (v:Variant,p:Page) => history.replaceState(null,"",`?variant=${v}&page=${p}`);
  const setVariant = (v:Variant) => { setV(v); sync(v,page); };
  const setPage = (p:Page) => { setP(p); sync(variant,p); scrollTo({top:0}); };
  return <><a className="skip" href="#main">Skip to content</a><div id="main">
    {variant === "A" ? <VariantA page={page} onGo={setPage}/> : variant === "B" ? <VariantB page={page} onGo={setPage}/> : <VariantC page={page} onGo={setPage}/>}
  </div><Switcher variant={variant} page={page} setVariant={setVariant} setPage={setPage}/></>;
}

createRoot(document.getElementById("root")!).render(<App/>);
