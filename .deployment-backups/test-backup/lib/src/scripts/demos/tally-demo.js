import { Demo, registerDemo } from "./demo-engine.js";
class TallyDemo extends Demo {
    constructor() {
        super("tally", "Village Tally Network", "balanced", "Experience how medieval villagers used split sticks to track debts and maintain fairness over time");
    }
    async run(container) {
        const content = `
      <div class="demo-scenario">
        <p><strong>Scenario:</strong> Alice owes Bob 3 chickens for winter grain. They create a tally stick to record the debt.</p>
        
        <div class="tally-visualization">
          <div class="tally-stick">
            <div class="stock">📋 Alice's Stock</div>
            <div class="split-line">✂️</div>
            <div class="foil">📋 Bob's Foil</div>
          </div>
        </div>
        
        <div class="demo-steps">
          <div class="step">
            <span class="step-number">1</span>
            <div class="step-content">
              <strong>Record Debt:</strong> Notches carved for 3 chickens
            </div>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <div class="step-content">
              <strong>Split Stick:</strong> Alice keeps "stock," Bob keeps "foil"
            </div>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <div class="step-content">
              <strong>Proof System:</strong> Both pieces must match to settle debt
            </div>
          </div>
        </div>
        
        <div class="balanced-features">
          <h5>Balanced Mode Features:</h5>
          <ul>
            <li>✅ Both parties have proof of the debt</li>
            <li>✅ Cannot be counterfeited (pieces must match exactly)</li>
            <li>✅ Symmetric obligation (both hold records)</li>
            <li>✅ Debt settled when pieces reunite</li>
          </ul>
        </div>
      </div>
      
      ${this.createModeAnalysis({
            balanced: "Primary mode - tally creates symmetric record-keeping system where both parties maintain proof of obligation",
            obligated: "Village customs and social pressure enforce the tally system's legitimacy",
            value: "Standard notch system allows proportional representation of different debt amounts",
            immediate: "Physical splitting feels viscerally fair - \"you get half, I get half\""
        })}
    `;
        this.createDemoStructure(container, content);
        const style = document.createElement("style");
        style.textContent = `
      .tally-visualization {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }
      
      .tally-stick {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px;
        background: rgba(255,255,255,.05);
        border-radius: 12px;
        border: 2px solid var(--balanced);
      }
      
      .stock, .foil {
        padding: 10px 15px;
        background: rgba(76,201,240,.15);
        border-radius: 8px;
        font-size: 14px;
      }
      
      .split-line {
        font-size: 20px;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .demo-steps {
        display: grid;
        gap: 15px;
        margin: 20px 0;
      }
      
      .step {
        display: flex;
        gap: 15px;
        align-items: flex-start;
      }
      
      .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--balanced);
        color: #000;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      .balanced-features {
        margin-top: 20px;
        padding: 15px;
        background: rgba(76,201,240,.08);
        border-radius: 8px;
        border-left: 4px solid var(--balanced);
      }
      
      .balanced-features ul {
        margin: 10px 0 0 0;
        padding-left: 0;
        list-style: none;
      }
      
      .balanced-features li {
        margin: 8px 0;
        font-size: 14px;
      }
    `;
        document.head.appendChild(style);
    }
}
registerDemo(new TallyDemo());
//# sourceMappingURL=tally-demo.js.map