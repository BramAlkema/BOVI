// M1: Tiles API (stubbed; replace internals when wiring real data)

export type BillsSafe = "OK" | "WATCH";
export async function getBillsSafe(): Promise<BillsSafe> {
  // INTEGRATION: Integrate with pots API (lib/m1/pots.ts) and sweeps module
  // Simulate checking account balance vs upcoming bills
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call

  const upcomingBills = 450; // Mock upcoming bills
  const availableBalance = 1200; // Mock balance

  return availableBalance > upcomingBills * 1.2 ? "OK" : "WATCH";
}

export async function getBestDeal(): Promise<{ label: string; delta: number }> {
  // INTEGRATION: Connect to PDA comparison engine (lib/engines/pda.ts) and cohort pricing data
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API call

  // Mock savings opportunities
  const deals = [
    { label: "Groceries swap saves", delta: 2.1 },
    { label: "Energy switch saves", delta: 12.5 },
    { label: "Insurance renewal saves", delta: 8.3 },
  ];

  return deals[Math.floor(Math.random() * deals.length)];
}

export type EnergyStatus = "OK" | "Switching" | "Join cohort";
export async function getEnergyStatus(): Promise<EnergyStatus> {
  // INTEGRATION: Connect to cohort services for energy switching status
  await new Promise(resolve => setTimeout(resolve, 120)); // Simulate API call

  const statuses: EnergyStatus[] = ["OK", "Switching", "Join cohort"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}
