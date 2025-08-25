export async function getBillsSafe() {
    await new Promise(resolve => setTimeout(resolve, 100));
    const upcomingBills = 450;
    const availableBalance = 1200;
    return availableBalance > upcomingBills * 1.2 ? "OK" : "WATCH";
}
export async function getBestDeal() {
    await new Promise(resolve => setTimeout(resolve, 150));
    const deals = [
        { label: "Groceries swap saves", delta: 2.1 },
        { label: "Energy switch saves", delta: 12.5 },
        { label: "Insurance renewal saves", delta: 8.3 },
    ];
    return deals[Math.floor(Math.random() * deals.length)];
}
export async function getEnergyStatus() {
    await new Promise(resolve => setTimeout(resolve, 120));
    const statuses = ["OK", "Switching", "Join cohort"];
    return statuses[Math.floor(Math.random() * statuses.length)];
}
//# sourceMappingURL=tiles.js.map