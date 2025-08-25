/**
 * Smart Contracts Service Tests
 */

import {
  createSmartContract,
  downloadPDFReceipt,
  getStoredContracts,
  signContract,
  canUndoContract,
  undoContract,
  type ContractClause,
  type SmartContract
} from '../smart-contracts.js';

// Mock jsPDF
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setTextColor: jest.fn(),
    splitTextToSize: jest.fn(() => ['mocked split text']),
    output: jest.fn(() => new Blob(['mock pdf'], { type: 'application/pdf' }))
  }))
}));

describe('Smart Contracts Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('createSmartContract', () => {
    it('creates a rent contract with proper structure', async () => {
      const clause: ContractClause = {
        ltsIndex: 'bovi-local',
        capBp: 300,
        floorBp: -100,
        carry: true,
        undoWindowHours: 72
      };

      const result = await createSmartContract('rent', ['tenant', 'landlord'], clause);

      expect(result.contract).toMatchObject({
        templateId: 'rent',
        parties: ['tenant', 'landlord'],
        clause,
        signed: false
      });

      expect(result.contract.id).toMatch(/^contract_\d+$/);
      expect(result.contract.humanReadable).toContain('Annual rent adjustment');
      expect(result.receipt.pdf).toBeInstanceOf(Blob);
      expect(result.receipt.json).toBeDefined();
    });

    it('creates salary contract with different template', async () => {
      const clause: ContractClause = {
        ltsIndex: 'bovi-cohort',
        capBp: 500,
        carry: false,
        undoWindowHours: 48
      };

      const result = await createSmartContract('salary', ['employee', 'employer'], clause);

      expect(result.contract.templateId).toBe('salary');
      expect(result.contract.humanReadable).toContain('Annual salary review');
    });

    it('stores contract in localStorage', async () => {
      const clause: ContractClause = {
        ltsIndex: 'bovi-local',
        carry: true,
        undoWindowHours: 24
      };

      await createSmartContract('loan', ['borrower', 'lender'], clause);

      const stored = getStoredContracts();
      expect(stored).toHaveLength(1);
      expect(stored[0].templateId).toBe('loan');
    });

    it('sets proper timestamps', async () => {
      const clause: ContractClause = {
        ltsIndex: 'bovi-local',
        carry: true,
        undoWindowHours: 72
      };

      const result = await createSmartContract('rent', ['tenant', 'landlord'], clause);
      const now = new Date();
      const created = new Date(result.contract.created);
      const effective = new Date(result.contract.effectiveFrom);
      const undoDeadline = new Date(result.contract.undoDeadline);

      expect(Math.abs(created.getTime() - now.getTime())).toBeLessThan(1000);
      expect(effective.getTime() - created.getTime()).toBeCloseTo(24 * 60 * 60 * 1000, -3);
      expect(undoDeadline.getTime() - created.getTime()).toBeCloseTo(72 * 60 * 60 * 1000, -3);
    });
  });

  describe('contract management', () => {
    let contract: SmartContract;

    beforeEach(async () => {
      const clause: ContractClause = {
        ltsIndex: 'bovi-local',
        carry: true,
        undoWindowHours: 72
      };

      const result = await createSmartContract('rent', ['tenant', 'landlord'], clause);
      contract = result.contract;
    });

    it('signs contract successfully', () => {
      expect(contract.signed).toBe(false);
      
      const success = signContract(contract.id);
      
      expect(success).toBe(true);
      const stored = getStoredContracts();
      expect(stored[0].signed).toBe(true);
    });

    it('returns false when signing non-existent contract', () => {
      const success = signContract('non-existent-id');
      expect(success).toBe(false);
    });

    it('checks undo availability correctly', () => {
      // Should be able to undo within window
      expect(canUndoContract(contract.id)).toBe(true);

      // Mock expired contract
      const expiredContract = {
        ...contract,
        id: 'expired-contract',
        undoDeadline: new Date(Date.now() - 1000).toISOString()
      };
      
      localStorage.setItem('bovi.smartContracts', JSON.stringify([expiredContract]));
      expect(canUndoContract('expired-contract')).toBe(false);
    });

    it('undoes contract within window', () => {
      expect(getStoredContracts()).toHaveLength(1);

      const success = undoContract(contract.id);

      expect(success).toBe(true);
      expect(getStoredContracts()).toHaveLength(0);
    });

    it('prevents undoing expired contract', () => {
      // Mock expired contract
      const expiredContract = {
        ...contract,
        undoDeadline: new Date(Date.now() - 1000).toISOString()
      };
      
      localStorage.setItem('bovi.smartContracts', JSON.stringify([expiredContract]));

      const success = undoContract(contract.id);

      expect(success).toBe(false);
      expect(getStoredContracts()).toHaveLength(1);
    });
  });

  describe('downloadPDFReceipt', () => {
    it('creates download link and triggers download', () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };

      // Mock DOM methods
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

      downloadPDFReceipt(mockBlob, 'test-contract-123');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('BOVI_Contract_test-contract-123.pdf');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('mock-url');

      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('getStoredContracts', () => {
    it('returns empty array when no contracts stored', () => {
      const contracts = getStoredContracts();
      expect(contracts).toEqual([]);
    });

    it('returns stored contracts', async () => {
      // Create a contract first
      const clause: ContractClause = {
        ltsIndex: 'bovi-local',
        carry: true,
        undoWindowHours: 24
      };

      await createSmartContract('rent', ['tenant', 'landlord'], clause);
      await createSmartContract('salary', ['employee', 'employer'], clause);

      const contracts = getStoredContracts();
      expect(contracts).toHaveLength(2);
      expect(contracts[0].templateId).toBe('rent');
      expect(contracts[1].templateId).toBe('salary');
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('bovi.smartContracts', 'invalid json');
      
      const contracts = getStoredContracts();
      expect(contracts).toEqual([]);
    });
  });
});