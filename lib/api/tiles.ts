// M1: Tiles API (stubbed; replace internals when wiring real data)

export type BillsSafe = "OK" | "WATCH";
export async function getBillsSafe(): Promise<BillsSafe> {
  // TODO: compute from pots/sweeps & upcoming dues
  // Simulate checking account balance vs upcoming bills
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
  
  const upcomingBills = 450; // Mock upcoming bills
  const availableBalance = 1200; // Mock balance
  
  return availableBalance > upcomingBills * 1.2 ? "OK" : "WATCH";
}

export async function getBestDeal(): Promise<{ label: string; delta: number }> {
  // TODO: fetch from PDA/cohorts
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API call
  
  // Mock savings opportunities
  const deals = [
    { label: "Groceries swap saves", delta: 2.10 },
    { label: "Energy switch saves", delta: 12.50 },
    { label: "Insurance renewal saves", delta: 8.30 }
  ];
  
  return deals[Math.floor(Math.random() * deals.length)];
}

export type EnergyStatus = "OK" | "Switching" | "Join cohort";
export async function getEnergyStatus(): Promise<EnergyStatus> {
  // TODO: derive from cohort module
  await new Promise(resolve => setTimeout(resolve, 120)); // Simulate API call
  
  const statuses: EnergyStatus[] = ["OK", "Switching", "Join cohort"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}