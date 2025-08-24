// Smart-contract templates (off-chain first)
export interface LTSIndexRef { 
  baseYear: number; 
  deflator: number;
}

export interface M3ContractTemplate {
  id: string; 
  kind: "rent" | "subscription"; 
  amountLTS: number; 
  index: LTSIndexRef;
  capBp?: number; 
  floorBp?: number; 
  carryOver?: boolean; 
  undoWindowSec: number; 
  text?: string;
}

export interface Rendered { 
  json: Blob; 
  txt: Blob; 
  hash: string;
}

export async function renderContract(ct: M3ContractTemplate): Promise<Rendered> {
  const json = new Blob([JSON.stringify(ct, null, 2)], { type:"application/json" });
  const txt = new Blob([humanText(ct)], { type:"text/plain" });
  const hash = await sha256(await blobToArrayBuffer(json));
  return { json, txt, hash };
}

function humanText(ct: M3ContractTemplate) {
  return `Contract: ${ct.kind}
Base amount: €LTS ${ct.amountLTS} (base ${ct.index.baseYear})
Indexation: deflator=${ct.index.deflator}
Caps: +${ct.capBp??"-"}bp / floor ${ct.floorBp??"-"}bp, carryOver=${!!ct.carryOver}
Undo window: ${ct.undoWindowSec}s`;
}

async function blobToArrayBuffer(b: Blob) { 
  return await b.arrayBuffer(); 
}

async function sha256(buf: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return "0x"+[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("");
}