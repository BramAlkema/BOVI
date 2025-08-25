export async function createSmartContract(templateId, parties, clause) {
    const templates = {
        rent: "Annual rent adjustment shall be the lesser of LTS inflation or {cap}%, with a floor of {floor}% decrease.",
        salary: "Annual salary review based on LTS inflation, capped at {cap}% increase.",
        loan: "Variable rate tied to LTS inflation + {margin}%, with {floor}% minimum rate.",
    };
    const contract = {
        id: `contract_${Date.now()}`,
        templateId,
        parties,
        clause,
        humanReadable: templates[templateId]
            .replace("{cap}", ((clause.capBp || 0) / 100).toString())
            .replace("{floor}", ((clause.floorBp || 0) / 100).toString()),
        created: new Date().toISOString(),
        effectiveFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        undoDeadline: new Date(Date.now() + clause.undoWindowHours * 60 * 60 * 1000).toISOString(),
        signed: false,
    };
    const pdfReceipt = await generatePDFReceipt(contract);
    const jsonReceipt = JSON.stringify(contract, null, 2);
    const contracts = JSON.parse(localStorage.getItem("bovi.smartContracts") || "[]");
    contracts.push(contract);
    localStorage.setItem("bovi.smartContracts", JSON.stringify(contracts));
    return {
        contract,
        receipt: {
            pdf: pdfReceipt,
            json: jsonReceipt,
        },
    };
}
async function generatePDFReceipt(contract) {
    const content = `
BOVI Smart Contract Receipt

Contract ID: ${contract.id}
Template: ${contract.templateId}
Parties: ${contract.parties.join(", ")}

Terms:
${contract.humanReadable}

LTS Index: ${contract.clause.ltsIndex}
Cap: ${contract.clause.capBp}bp
Floor: ${contract.clause.floorBp}bp
Carryover: ${contract.clause.carry ? "Yes" : "No"}

Effective: ${contract.effectiveFrom}
Undo until: ${contract.undoDeadline}

Generated: ${new Date().toISOString()}
  `;
    return new Blob([content], { type: "application/pdf" });
}
//# sourceMappingURL=smart-contracts.js.map