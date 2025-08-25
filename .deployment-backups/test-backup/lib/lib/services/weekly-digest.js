export async function generateWeeklyDigest() {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
        period: `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`,
        highlights: [
            "Personal inflation ran 0.15% higher than official CPI",
            "Grocery basket increased 2.3% week-over-week",
            "Energy costs stable despite cold weather",
        ],
        netChange: -12.45,
        recommendations: [
            "Consider switching to Tesco own-brand cereals (saving: £3.20/week)",
            "Your mortgage rate beats inflation by 1.2% - good position",
            "Council tax increase kicks in next month - budget +£8/week",
        ],
    };
}
//# sourceMappingURL=weekly-digest.js.map