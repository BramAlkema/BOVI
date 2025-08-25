export async function renderContract(ct) {
    const json = new Blob([JSON.stringify(ct, null, 2)], { type: "application/json" });
    const txt = new Blob([humanText(ct)], { type: "text/plain" });
    const hash = await sha256(await blobToArrayBuffer(json));
    return { json, txt, hash };
}
function humanText(ct) {
    return `Contract: ${ct.kind}
Base amount: €LTS ${ct.amountLTS} (base ${ct.index.baseYear})
Indexation: deflator=${ct.index.deflator}
Caps: +${ct.capBp ?? "-"}bp / floor ${ct.floorBp ?? "-"}bp, carryOver=${!!ct.carryOver}
Undo window: ${ct.undoWindowSec}s`;
}
async function blobToArrayBuffer(b) {
    return await b.arrayBuffer();
}
async function sha256(buf) {
    const h = await crypto.subtle.digest("SHA-256", buf);
    return "0x" + [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}
//# sourceMappingURL=contracts.js.map