const fs = require('fs');
const path = 'src/i18n/locales/en.json';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  "Revenue stats": "Revenue Stats",
  "Payment methods": "Payment Methods",
  "Breakdown chart": "Breakdown Chart",
  "Number of orders": "Number of Orders",
  "Performance over time": "Performance over Time",
  "Refunds / held": "Refunds / Held",
  "Total sales": "Total Sales",
  "Total tax": "Total Tax",
  "Total (inc. tax)": "Total (Inc. Tax)",
  "Excl. tax": "Excl. Tax",
  "Tax amount": "Tax Amount",
  "Transaction history": "Transaction History",
  "Cash management log": "Cash Management Log",
  "Sales report": "Sales Report",
  "Staff hours": "Staff Hours",
  "Real-time": "Real-Time",
  "Total hours worked": "Total Hours Worked",
  "Total discounts issued": "Total Discounts Issued",
  "Total refunds": "Total Refunds",
  "Total variances": "Total Variances",
  "Staff performance overview": "Staff Performance Overview",
  "Performance metrics": "Performance Metrics",
  "Staff analysis": "Staff Analysis",
  "Shifts report": "Shifts Report",
  "Total over/short": "Total Over/Short",
  "Discrepancy overview": "Discrepancy Overview",
  "Shift period": "Shift Period",
  "No traffic data": "No Traffic Data",
  "Sales by hour": "Sales by Hour",
  "Busy times": "Busy Times",
  "Held orders": "Held Orders",
  "Receipts count": "Receipts Count",
  "Revenue (selected period)": "Revenue (Selected Period)",
  "Discount breakdown": "Discount Breakdown",
  "Times applied": "Times Applied",
  "Total discounted": "Total Discounted",
  "Add-on name": "Add-on Name",
  "Attribute group": "Attribute Group",
  "By add-ons": "By Add-ons",
  "By attributes (groups)": "By Attributes (Groups)",
  "By category": "By Category",
  "By products": "By Products",
  "Category name": "Category Name",
  "Gross revenue": "Gross Revenue",
  "Product name": "Product Name",
  "Units sold": "Units Sold",
  "Top method": "Top Method",
  "Total collected": "Total Collected",
  "Transaction count": "Transaction Count",
  "View all orders": "View All Orders"
};

for (const [oldVal, newVal] of Object.entries(replacements)) {
  const regex = new RegExp(`":\\s*"${oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
  content = content.replace(regex, `": "${newVal}"`);
}

fs.writeFileSync(path, content);
console.log('Successfully updated en.json');
