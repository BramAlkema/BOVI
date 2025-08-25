const BUTLERS = [
    {
        id: "core",
        name: "Core Butler",
        version: "1.0.0",
        caps: ["defaults", "pda", "pots"],
    },
];
let active = "core";
export async function installButler(_pkgUrl) {
}
export async function listButlers() {
    return BUTLERS;
}
export async function activateButler(id) {
    active = id;
    localStorage.setItem("butler", id);
}
export function getActiveButler() {
    return active || localStorage.getItem("butler") || "core";
}
//# sourceMappingURL=butlerHub.js.map