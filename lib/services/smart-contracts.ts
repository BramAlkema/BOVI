/**
 * BOVI Smart Contract Templates
 * Off-chain contracts with PDF receipts
 */

export interface ContractClause {
  ltsIndex: string; // Reference to LTS ruler
  capBp?: number; // Cap in basis points
  floorBp?: number; // Floor in basis points
  carry: boolean; // Carry over unused adjustments
  undoWindowHours: number;
}

export interface SmartContract {
  id: string;
  templateId: string;
  parties: string[];
  clause: ContractClause;
  humanReadable: string;
  created: string;
  effectiveFrom: string;
  undoDeadline: string;
  signed: boolean;
}

/**
 * Create contract from template with LTS indexation
 */
export async function createSmartContract(
  templateId: 'rent' | 'salary' | 'loan',
  parties: string[],
  clause: ContractClause
): Promise<{ contract: SmartContract; receipt: { pdf: Blob; json: string } }> {
  
  const templates = {
    rent: 'Annual rent adjustment shall be the lesser of LTS inflation or {cap}%, with a floor of {floor}% decrease.',
    salary: 'Annual salary review based on LTS inflation, capped at {cap}% increase.',
    loan: 'Variable rate tied to LTS inflation + {margin}%, with {floor}% minimum rate.'
  };
  
  const contract: SmartContract = {
    id: `contract_${Date.now()}`,
    templateId,
    parties,
    clause,
    humanReadable: templates[templateId]
      .replace('{cap}', ((clause.capBp || 0) / 100).toString())
      .replace('{floor}', ((clause.floorBp || 0) / 100).toString()),
    created: new Date().toISOString(),
    effectiveFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    undoDeadline: new Date(Date.now() + clause.undoWindowHours * 60 * 60 * 1000).toISOString(),
    signed: false
  };
  
  // Generate receipts
  const pdfReceipt = await generatePDFReceipt(contract);
  const jsonReceipt = JSON.stringify(contract, null, 2);
  
  // Store contract
  const contracts = JSON.parse(localStorage.getItem('bovi.smartContracts') || '[]');
  contracts.push(contract);
  localStorage.setItem('bovi.smartContracts', JSON.stringify(contracts));
  
  return {
    contract,
    receipt: {
      pdf: pdfReceipt,
      json: jsonReceipt
    }
  };
}

/**
 * Generate PDF receipt for contract
 */
async function generatePDFReceipt(contract: SmartContract): Promise<Blob> {
  // In production, would use jsPDF
  const content = `
BOVI Smart Contract Receipt

Contract ID: ${contract.id}
Template: ${contract.templateId}
Parties: ${contract.parties.join(', ')}

Terms:
${contract.humanReadable}

LTS Index: ${contract.clause.ltsIndex}
Cap: ${contract.clause.capBp}bp
Floor: ${contract.clause.floorBp}bp
Carryover: ${contract.clause.carry ? 'Yes' : 'No'}

Effective: ${contract.effectiveFrom}
Undo until: ${contract.undoDeadline}

Generated: ${new Date().toISOString()}
  `;
  
  return new Blob([content], { type: 'application/pdf' });
}