/**
 * Generate a standalone HTML preview page for all email templates.
 * Run: node scripts/generate-email-preview.js
 * Then open: backend/email-preview.html
 */
const fs = require('fs');
const path = require('path');

// We need to extract the template HTML from the seeder without requiring mongoose
// So we'll read the seeder file and eval the template building parts only

const seederPath = path.join(__dirname, '..', 'seeders', 'emailTemplates.js');
const seederSrc = fs.readFileSync(seederPath, 'utf8');

// Extract everything before "const defaultTemplates" and the defaultTemplates array
// We'll build a sandboxed version that doesn't need mongoose
const sandboxCode = seederSrc
  .replace("const EmailTemplate = require('../models/EmailTemplate');", '')
  .replace(/async function seedEmailTemplates[\s\S]*$/, '')
  .replace('module.exports = seedEmailTemplates;', '');

// Execute in a function scope to get defaultTemplates
const getTemplates = new Function(`
  ${sandboxCode}
  return defaultTemplates;
`);

const templates = getTemplates();

// Sample data for previewing
const sampleData = {
  customer_name: 'Sipho Ndlovu',
  login_url: 'https://pesashop.com/login',
  shop_url: 'https://pesashop.com',
  supportEmail: 'support@pesashop.com',
  frontendUrl: 'https://pesashop.com',
  logoUrl: 'https://placehold.co/180x40/0F604B/FFFFFF?text=PESASHOP&font=montserrat',
  year: new Date().getFullYear().toString(),
  order_number: 'ORD-10045',
  order_date: '21 Jul 2025',
  order_total: 'R 1,849.00',
  order_items: `
    <table border="0" cellpadding="10" cellspacing="0" width="100%" style="font-size:14px;">
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:12px 0;border-bottom:1px solid #eee;"><strong>Nike Air Max 90</strong><br><span style="color:#999;font-size:12px;">Size: 10 | Colour: Black</span></td>
        <td style="text-align:center;border-bottom:1px solid #eee;">x1</td>
        <td style="text-align:right;border-bottom:1px solid #eee;font-weight:600;">R 1,299.00</td>
      </tr>
      <tr>
        <td style="padding:12px 0;"><strong>Cotton Crew Socks (3-Pack)</strong><br><span style="color:#999;font-size:12px;">White</span></td>
        <td style="text-align:center;">x2</td>
        <td style="text-align:right;font-weight:600;">R 550.00</td>
      </tr>
    </table>`,
  subtotal: 'R 1,749.00',
  shipping_cost: 'R 100.00',
  shipping_address: 'Sipho Ndlovu<br>42 Long Street<br>Cape Town, Western Cape 8001<br>South Africa',
  delivery_method: 'Standard Delivery',
  tracking_url: '#',
  tracking_number: 'TRK-SA-20250721-4589',
  estimated_delivery: '25 Jul 2025',
  delivery_date: '25 Jul 2025',
  cancellation_reason: 'Item out of stock — full refund will be processed within 5 business days.',
  refund_amount: 'R 1,849.00',
  note_content: 'Hi Sipho, we wanted to let you know that one item in your order has been substituted with an equivalent product due to stock availability. Please contact us if you have any concerns.',
  reset_url: '#',
  expiry_hours: '24',
  review_url: '#',
  plan_name: '3-Month Layby Plan',
  total_amount: 'R 4,500.00',
  deposit_amount: 'R 1,500.00',
  installment_amount: 'R 1,000.00',
  payment_link: '#',
  payment_amount: 'R 1,000.00',
  paid_amount: 'R 2,500.00',
  remaining_balance: 'R 2,000.00',
  payment_date: '15 Aug 2025',
  message: 'Your next laybye payment of R 1,000.00 is due in 3 days. Please ensure payment is made before the due date to avoid late fees.',
  promo_title: 'WINTER SALE — 30% OFF!',
  promo_subtitle: 'Limited time only — ends this Sunday',
  promo_body: 'Get 30% off on all winter essentials including jackets, boots, and accessories. Use the code below at checkout to claim your discount. Hurry — stock is limited!',
  coupon_code: 'WINTER30',
  subject: 'Email Preview',
};

// Render each template with sample data
const rendered = templates.map(t => {
  let html = t.htmlContent;
  Object.keys(sampleData).forEach(key => {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), sampleData[key]);
  });
  return { name: t.name, html };
});

// Build preview HTML page
const escapedTemplates = rendered.map(r => ({
  name: r.name,
  html: r.html.replace(/`/g, '\\`').replace(/\$/g, '\\$'),
}));

const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PesaShop Email Template Preview</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #1a1a2e; color: #fff; }
  .nav { display: flex; flex-wrap: wrap; gap: 8px; padding: 20px 24px; background: #16213e; position: sticky; top: 0; z-index: 10; border-bottom: 2px solid #0F604B; }
  .nav button { padding: 8px 16px; border: 1px solid #334; background: #1a1a2e; color: #ccc; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
  .nav button:hover, .nav button.active { background: #0F604B; color: #fff; border-color: #0F604B; }
  .preview-wrap { width: 100%; max-width: 700px; margin: 30px auto; }
  h1 { text-align: center; padding: 16px; font-size: 13px; color: #666; letter-spacing: 1px; text-transform: uppercase; }
  .preview-frame { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
  .preview-frame iframe { width: 100%; height: 1000px; border: none; }
</style>
</head>
<body>
<div class="nav" id="nav"></div>
<div class="preview-wrap">
  <h1 id="title">Select a template above</h1>
  <div class="preview-frame">
    <iframe id="preview" srcdoc="<p style='text-align:center;padding:60px;color:#999;font-family:sans-serif;'>Click a template above to preview</p>"></iframe>
  </div>
</div>

<script>
const templates = [
${escapedTemplates.map(t => `  { name: ${JSON.stringify(t.name)}, html: \`${t.html}\` }`).join(',\n')}
];

const nav = document.getElementById('nav');
templates.forEach((t, i) => {
  const btn = document.createElement('button');
  btn.textContent = t.name;
  btn.onclick = () => {
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('title').textContent = t.name;
    document.getElementById('preview').srcdoc = t.html;
  };
  nav.appendChild(btn);
  if (i === 0) btn.click();
});
</script>
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'email-preview.html');
fs.writeFileSync(outPath, previewHtml, 'utf8');
console.log(`✅ Email preview generated: ${outPath}`);
console.log(`   ${rendered.length} templates rendered with sample data`);
console.log(`   Open in browser to preview all templates`);
