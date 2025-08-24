/**
 * BOVI Scenario Data
 * Real-world scenarios for BOVI mode analysis
 */

import { Scenario, registerScenario } from '../scripts/scenarios/scenario-engine.js';

// Rent Collection Scenario
const rentScenario = new Scenario(
  'rent',
  'Rent Collection Analysis',
  'balanced',
  'Monthly rent payments create a ongoing relationship between tenant and landlord that involves multiple fairness modes.'
)
.addModeBreakdown('balanced', 'Monthly payment creates symmetric obligation. Tenant receives housing, landlord receives payment. Both parties expect the relationship to balance over time through consistent performance.')
.addModeBreakdown('obligated', 'Legal framework enforces the rental contract. Courts provide authority backing. Eviction procedures represent hierarchical power when obligations are not met.')
.addModeBreakdown('value', 'Rent amount reflects market pricing of housing value. Location, size, and amenities determine proportional exchange rates in the local market.')
.addModeBreakdown('immediate', '"Roof over head for money" feels directly fair at gut level. The exchange appears viscerally equivalent - shelter for payment.')
.addInsights(
  'Primary mode is Balanced because ongoing monthly exchanges require symmetric record-keeping',
  'Rent control policies often conflict between Value mode (market pricing) and Immediate mode (affordability intuitions)',
  'Landlord-tenant disputes usually center on which fairness mode should dominate the relationship'
);

// Tax Payment Scenario  
const taxScenario = new Scenario(
  'tax',
  'Tax Payment Analysis', 
  'obligated',
  'Government taxation demonstrates how authority creates money demand through hierarchical obligation.'
)
.addModeBreakdown('obligated', 'Government authority requires payment regardless of individual preference. No choice - you owe what the hierarchy demands based on rules and status.')
.addModeBreakdown('balanced', 'Citizens expect public services in return for taxes paid. "Social contract" implies symmetric obligations between government and governed.')
.addModeBreakdown('value', 'Tax rates theoretically reflect proportional contribution to society based on income, wealth, or consumption capacity.')
.addModeBreakdown('immediate', '"Pay your fair share" appeals to direct reciprocity instinct. Community membership implies mutual contribution obligations.')
.addInsights(
  'Tax resistance often occurs when Obligated mode lacks legitimacy from other modes',
  'Progressive taxation conflicts between Value mode (proportional) and Immediate mode (equal treatment)',
  'Tax compliance depends on Authority Ranking acceptance combined with Balanced mode service expectations'
);

// Farmers Market Scenario
const marketScenario = new Scenario(
  'market',
  'Farmers Market Analysis',
  'value', 
  'Direct commerce at farmers markets demonstrates pure market pricing with supporting fairness modes.'
)
.addModeBreakdown('value', 'Cash enables proportional exchange. $5 apples versus $2 carrots - units are interchangeable tokens representing relative value.')
.addModeBreakdown('immediate', '"Good produce for good money" feels directly equivalent. Quality food for quality currency appears viscerally fair.')
.addModeBreakdown('balanced', 'Repeated transactions create reputation ledger over time. Vendors and customers build symmetric relationships through consistent exchanges.')
.addModeBreakdown('obligated', 'Health regulations and market rules provide authority framework. Permits, inspections, and standards create hierarchical oversight.')
.addInsights(
  'Local markets often emphasize Immediate and Balanced modes over pure Value mode efficiency',
  'Vendor relationships matter - people pay premiums for trusted sources despite Value mode alternatives',
  'Farmers markets resist corporate Value mode optimization in favor of community-oriented fairness'
);

// Neighborhood Favors Scenario
const favorScenario = new Scenario(
  'favor',
  'Neighborhood Favors Analysis',
  'immediate',
  'Direct reciprocity between neighbors demonstrates pure Immediate mode fairness with minimal institutional mediation.'
)
.addModeBreakdown('immediate', 'Direct reciprocity dominates. Childcare time for fence repair time - equivalent effort exchange within community boundaries.')
.addModeBreakdown('balanced', '"You helped me, now I help you" creates ongoing account of mutual aid. Community members track reciprocity patterns over time.')
.addModeBreakdown('value', 'Both parties assess whether the trade feels proportionally fair. Time spent versus favor received gets informal market evaluation.')
.addModeBreakdown('obligated', 'Social pressure and community norms enforce reciprocity expectations. Neighborhood reputation creates informal authority structure.')
.addInsights(
  'Immediate mode works best in small, stable communities where reputation matters',
  'Monetizing neighbor relationships often feels wrong because it violates Immediate mode expectations',
  'Community resilience depends on maintaining Immediate mode networks alongside formal economy'
);

// Grocery Shopping Scenario
const groceryScenario = new Scenario(
  'grocery',
  'Grocery Shopping Analysis',
  'value',
  'Supermarket transactions demonstrate how Value mode efficiency can conflict with other fairness intuitions.'
)
.addModeBreakdown('value', 'Standardized pricing and UPC codes enable efficient proportional exchange. Price comparison shopping optimizes value ratios.')
.addModeBreakdown('obligated', 'Corporate pricing power and regulatory frameworks create authority relationships. "Take it or leave it" pricing demonstrates hierarchical control.')
.addModeBreakdown('balanced', 'Loyalty programs attempt to create symmetric relationships. Points and discounts reward repeated patronage over time.')
.addModeBreakdown('immediate', 'Fresh food for cash feels viscerally equivalent. But corporate intermediation distances consumers from direct producer relationships.')
.addInsights(
  'Shrinkflation violates Balanced mode expectations - same price, less product feels like cheating',
  'Local grocery stores often succeed by emphasizing Immediate and Balanced modes over pure Value efficiency',
  'Supply chain disruptions reveal how Value mode optimization sacrifices other fairness modes'
);

// Register all scenarios
registerScenario(rentScenario);
registerScenario(taxScenario);
registerScenario(marketScenario);
registerScenario(favorScenario);
registerScenario(groceryScenario);

export {
  rentScenario,
  taxScenario,
  marketScenario,
  favorScenario,
  groceryScenario
};