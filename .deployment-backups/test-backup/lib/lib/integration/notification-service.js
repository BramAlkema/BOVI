import { generateWeeklyDigest } from "../services/weekly-digest.js";
import { getRulers } from "../services/rulers.js";
export class NotificationService {
    initialize() {
        this.startWeeklyDigest();
        this.startStormModeMonitoring();
        console.log("📢 Notification service initialized");
    }
    startWeeklyDigest() {
        const lastDigest = localStorage.getItem("bovi.lastWeeklyDigest");
        const weeksSince = lastDigest
            ? (Date.now() - parseInt(lastDigest)) / (1000 * 60 * 60 * 24 * 7)
            : 999;
        if (weeksSince >= 1) {
            setTimeout(async () => {
                try {
                    const digest = await generateWeeklyDigest();
                    this.showDigestModal(digest);
                    localStorage.setItem("bovi.lastWeeklyDigest", Date.now().toString());
                }
                catch (error) {
                    console.error("Weekly digest error:", error);
                }
            }, 5000);
        }
        this.digestInterval = window.setInterval(() => {
            this.checkForWeeklyDigest();
        }, 24 * 60 * 60 * 1000);
    }
    startStormModeMonitoring() {
        this.stormMonitoringInterval = window.setInterval(async () => {
            try {
                const rulers = await getRulers();
                const localInflation = rulers.find(r => r.id === "bovi-local")?.bpDrift || 0;
                if (localInflation > 500) {
                    const hasStormProfile = JSON.parse(localStorage.getItem("bovi.stormProfiles") || "[]").length > 0;
                    if (hasStormProfile && !localStorage.getItem("bovi.stormMode.active")) {
                        this.showStormModeAlert();
                    }
                }
            }
            catch (error) {
                console.warn("Storm mode monitoring error:", error);
            }
        }, 300000);
    }
    async checkForWeeklyDigest() {
        const lastDigest = localStorage.getItem("bovi.lastWeeklyDigest");
        const weeksSince = lastDigest
            ? (Date.now() - parseInt(lastDigest)) / (1000 * 60 * 60 * 24 * 7)
            : 999;
        if (weeksSince >= 1) {
            try {
                const digest = await generateWeeklyDigest();
                this.showDigestModal(digest);
                localStorage.setItem("bovi.lastWeeklyDigest", Date.now().toString());
            }
            catch (error) {
                console.error("Weekly digest error:", error);
            }
        }
    }
    showDigestModal(digest) {
        const event = new CustomEvent("bovi.showDigest", { detail: digest });
        window.dispatchEvent(event);
        setTimeout(() => {
            if (!event.defaultPrevented) {
                console.log("Weekly Digest:", digest);
                this.showNotification("📊 Weekly digest available - check console for details");
            }
        }, 100);
    }
    showStormModeAlert() {
        this.showNotification("⛈️ High inflation detected! Consider activating Storm Mode.", "error");
    }
    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        Object.assign(notification.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            backgroundColor: type === "error" ? "#dc2626" : type === "success" ? "#059669" : "#2563eb",
            color: "white",
            borderRadius: "6px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            zIndex: "9999",
            fontFamily: "system-ui, sans-serif",
            fontSize: "14px",
            maxWidth: "300px",
            wordWrap: "break-word",
        });
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    stop() {
        if (this.digestInterval) {
            clearInterval(this.digestInterval);
            this.digestInterval = undefined;
        }
        if (this.stormMonitoringInterval) {
            clearInterval(this.stormMonitoringInterval);
            this.stormMonitoringInterval = undefined;
        }
        console.log("📢 Notification service stopped");
    }
    restart() {
        this.stop();
        this.initialize();
    }
}
export const notificationService = new NotificationService();
//# sourceMappingURL=notification-service.js.map