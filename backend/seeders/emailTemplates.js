const EmailTemplate = require('../models/EmailTemplate');

// ─── Brand constants ──────────────────────────────────────────────────────────
const HERO_BG = 'https://res.cloudinary.com/dovunkx5l/image/upload/v1774711091/pesashop/general/file_uwf5eb.jpg';
const LOGO    = 'https://admin.pesashop.com/assets/pesashop-logo-fl5txSyV.png';

// ─── Shared structural pieces ─────────────────────────────────────────────────
const HEAD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{storeName}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style type="text/css">
  body{margin:0;padding:24px 0;background-color:#eceae6;font-family:'Public Sans',Arial,sans-serif;-webkit-text-size-adjust:100%;}
  table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{border:0;display:block;line-height:100%;outline:none;text-decoration:none;}
  a{text-decoration:none;}
</style>
</head>`;

const HEADER = `<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td style="background:#fff;padding:20px 40px;border-bottom:3px solid #1a5c2e;">
  <a href="{{frontendUrl}}"><img src="${LOGO}" alt="{{storeName}}" height="50" style="height:50px;width:auto;"></a>
</td></tr>
</table>`;

const FOOTER = `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:36px;">
<tr><td style="background:linear-gradient(145deg,#112519 0%,#1a5c2e 100%);padding:46px 40px 36px;text-align:center;">
  <a href="{{frontendUrl}}"><img src="${LOGO}" alt="{{storeName}}" height="42" style="height:42px;width:auto;margin:0 auto 22px;filter:brightness(0) invert(1);"></a>
  <h2 style="font-family:'Public Sans',Arial,sans-serif;font-size:21px;font-weight:800;color:#fff;margin:0 0 6px;letter-spacing:-0.3px;">Your family deserves the best.</h2>
  <p style="font-family:'Public Sans',Arial,sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin:0 0 28px;letter-spacing:3px;text-transform:uppercase;">Send &nbsp;&middot;&nbsp; Love &nbsp;&middot;&nbsp; Home</p>
  <a href="{{frontendUrl}}" style="display:inline-block;background-color:#e8a000;color:#1a1a1a;font-family:'Public Sans',Arial,sans-serif;font-size:13px;font-weight:800;padding:13px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.4px;margin-bottom:34px;">Shop at {{storeName}} &rarr;</a>
  <hr style="border:0;border-top:1px solid rgba(255,255,255,0.09);margin:0 0 26px;">
  <p style="font-family:'Public Sans',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.22);margin:0;">&copy; {{year}} {{storeName}} &nbsp;&middot;&nbsp; <a href="{{frontendUrl}}" style="color:rgba(255,255,255,0.28);text-decoration:none;">pesashop.com</a></p>
</td></tr>
</table>`;

function wrap(body) {
  return `${HEAD}
<body>
<table align="center" border="0" cellpadding="0" cellspacing="0" width="680" style="background:#fff;box-shadow:0 4px 40px rgba(0,0,0,0.11);margin:0 auto;">
<tbody><tr><td>
${HEADER}
${body}
${FOOTER}
</td></tr></tbody>
</table>
</body>
</html>`;
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

// Hero banner — same background image + dark green overlay on EVERY template
function hero(icon, title, subtitle) {
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td style="background-image:url('${HERO_BG}');background-size:cover;background-position:center;background-repeat:no-repeat;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
  <td style="background:linear-gradient(145deg,rgba(18,42,25,0.82) 0%,rgba(26,92,46,0.78) 60%,rgba(20,55,30,0.85) 100%);padding:52px 48px 46px;text-align:center;">
    <div style="width:58px;height:58px;background:rgba(232,160,0,0.16);border:2px solid rgba(232,160,0,0.5);border-radius:50%;margin:0 auto 20px;line-height:58px;font-size:26px;text-align:center;">${icon}</div>
    <h1 style="font-family:'Public Sans',Arial,sans-serif;font-size:28px;font-weight:800;color:#fff;margin:0 0 12px;letter-spacing:-0.5px;">${title}</h1>
    <p style="font-family:'Public Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.82);margin:0;line-height:1.75;">${subtitle}</p>
  </td></tr></table>
</td></tr>
</table>`;
}

// Section heading (green uppercase with bottom border)
function sectionHead(label) {
  return `<p style="font-family:'Public Sans',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a5c2e;margin:32px 0 12px;padding-bottom:10px;border-bottom:2px solid #1a5c2e;">${label}</p>`;
}

// Meta strip — 2 or 3 equal columns with gold left border
function metaStrip(...cols) {
  const cells = cols.map((c, i) => {
    const br = i < cols.length - 1 ? 'border-right:1px solid #e8e5e0;padding-right:16px;' : 'padding-left:16px;';
    const pl = i > 0 ? 'padding-left:16px;' : '';
    return `<td style="${pl}${br}vertical-align:top;">
      <p style="font-family:'Public Sans',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;margin:0 0 5px;">${c.label}</p>
      <p style="font-family:'Public Sans',Arial,sans-serif;font-size:14px;font-weight:700;color:${c.color||'#1a1a1a'};margin:0;">${c.value}</p>
    </td>`;
  }).join('');
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td style="padding:0 40px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-left:4px solid #e8a000;margin-top:32px;">
  <tr><td style="padding:18px 24px;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
  </td></tr></table>
</td></tr>
</table>`;
}

// Key-value info table
function infoTable(rows) {
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;margin-top:8px;">
${rows.map((r, i) => {
  const bd = i < rows.length - 1 ? 'border-bottom:1px solid #eee;' : '';
  return `<tr>
  <td style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#555;padding:12px 20px;${bd}">${r.label}</td>
  <td style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;font-weight:700;color:${r.color||'#1a1a1a'};padding:12px 20px;text-align:right;${bd}">${r.value}</td>
</tr>`;
}).join('')}
</table>`;
}

// CTA button row
function cta(href, text, bg, fg) {
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td style="padding:28px 40px 6px;text-align:center;">
  <a href="${href}" style="display:inline-block;background-color:${bg||'#1a5c2e'};color:${fg||'#fff'};font-family:'Public Sans',Arial,sans-serif;font-size:14px;font-weight:700;padding:14px 40px;border-radius:4px;text-decoration:none;letter-spacing:0.4px;">${text} &rarr;</a>
</td></tr>
</table>`;
}

// Body text wrapper
function body(html) {
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:30px 40px 0;">${html}</td></tr></table>`;
}

// Content section (with padding sides)
function section(html) {
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:0 40px;">${html}</td></tr></table>`;
}

// WhatsApp + Email contact cards
const CONTACTS = `<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 40px 0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
    <td width="50%" style="padding-right:10px;vertical-align:top;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-radius:6px;border-top:3px solid #25D366;">
        <tr><td style="padding:18px 20px;">
          <p style="font-family:'Public Sans',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1a8a45;margin:0 0 10px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="#25D366" style="vertical-align:middle;margin-right:5px;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>WhatsApp Us</p>
          <p style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#555;line-height:1.9;margin:0;">
            <a href="https://wa.me/263789891646" style="color:#333;font-weight:600;text-decoration:none;">+263 78 989 1646</a><br>
            <a href="https://wa.me/27735637564" style="color:#333;font-weight:600;text-decoration:none;">+27 73 563 7564</a>
          </p>
        </td></tr>
      </table>
    </td>
    <td width="50%" style="padding-left:10px;vertical-align:top;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-radius:6px;border-top:3px solid #e8a000;">
        <tr><td style="padding:18px 20px;">
          <p style="font-family:'Public Sans',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#b07b00;margin:0 0 10px;">&#9993; Email Us</p>
          <p style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#555;line-height:1.9;margin:0;">
            <a href="mailto:{{supportEmail}}" style="color:#333;font-weight:600;text-decoration:none;">{{supportEmail}}</a><br>
            <span style="color:#bbb;font-size:12px;">We reply within 24 hours</span>
          </p>
        </td></tr>
      </table>
    </td>
  </tr></table>
</td></tr></table>`;

// Bottom spacer
const SPACER = `<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:20px 0;"></td></tr></table>`;

// ─── Standard body paragraph style ───────────────────────────────────────────
const P  = 'font-family:\'Public Sans\',Arial,sans-serif;font-size:14px;color:#666;line-height:1.8;margin:0 0 14px;';
const H2 = 'font-family:\'Public Sans\',Arial,sans-serif;font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 12px;';


// ═══════════════════════════════════════════════════════════════════════════════
// 1. WELCOME / NEW ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════════
const welcomeHtml = wrap(`
${hero('👋', 'Welcome to PesaShop!', 'We\'re thrilled to have you join our family, <strong style="color:#fff;">{{customer_name}}</strong>.')}
${body(`
  <h2 style="${H2}">Hey {{customer_name}} 👋</h2>
  <p style="${P}">Thank you for creating an account with <strong style="color:#1a1a1a;">{{storeName}}</strong>! You're now part of the family. Here's what you can do with your account:</p>
`)}
${section(infoTable([
  { label: '&#10003; &nbsp;Track your orders in real time',      value: '', color: '#1a5c2e' },
  { label: '&#10003; &nbsp;Save items to your wishlist',         value: '', color: '#1a5c2e' },
  { label: '&#10003; &nbsp;Earn PESA Coins with every purchase', value: '', color: '#1a5c2e' },
  { label: '&#10003; &nbsp;Get exclusive offers &amp; early access', value: '', color: '#1a5c2e' },
]))}
${cta('{{login_url}}', 'Start Shopping')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORDER CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════════
const orderConfirmationHtml = wrap(`
${hero('✓', 'Your Order is Confirmed!', 'Hi <strong style="color:#fff;">{{customer_name}}</strong>, we\'ve received your order and are getting it ready.')}
${metaStrip(
  { label: 'Order Number', value: '#{{order_number}}' },
  { label: 'Order Date',   value: '{{order_date}}' },
  { label: 'Order Total',  value: '{{order_total}}', color: '#1a5c2e' }
)}
${body(`
  <h2 style="${H2}">Hey {{customer_name}} 👋</h2>
  <p style="${P}">Thanks for shopping with <strong style="color:#1a1a1a;">{{storeName}}</strong>! We're preparing your items and will send a shipping confirmation once your order is on its way. Reach us at <a href="mailto:{{supportEmail}}" style="color:#1a5c2e;font-weight:600;">{{supportEmail}}</a> with any questions.</p>
`)}
${section(`
  ${sectionHead('Items Ordered')}
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#bbb;padding:10px 0;border-bottom:1px solid #eee;text-align:left;">Product</td>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#bbb;padding:10px 0;border-bottom:1px solid #eee;text-align:right;">Price</td>
    </tr>
  </table>
  {{order_items}}
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:4px;">
    <tr>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#aaa;padding:7px 0;text-align:left;">Subtotal</td>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#aaa;padding:7px 0;text-align:right;">{{subtotal}}</td>
    </tr>
    <tr>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#aaa;padding:7px 0;text-align:left;">Shipping</td>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#2d8049;font-weight:700;padding:7px 0;text-align:right;">{{shipping_cost}}</td>
    </tr>
    <tr><td colspan="2" style="padding:4px 0;"><hr style="border:0;border-top:2px solid #1a5c2e;margin:8px 0;"></td></tr>
    <tr>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:17px;font-weight:800;color:#1a5c2e;text-align:left;padding:2px 0;">Total</td>
      <td style="font-family:'Public Sans',Arial,sans-serif;font-size:17px;font-weight:800;color:#1a5c2e;text-align:right;padding:2px 0;">{{order_total}}</td>
    </tr>
  </table>
  ${sectionHead('{{fulfillment_heading}}')}
  <p style="font-family:'Public Sans',Arial,sans-serif;font-size:12px;font-weight:600;color:#888;margin:0 0 10px;">{{delivery_method}}</p>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-radius:6px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#555;line-height:1.85;margin:0;">{{fulfillment_details}}</p>
    </td></tr>
  </table>
`)}
${cta('{{order_link}}', 'View My Order')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 3. PASSWORD RESET
// ═══════════════════════════════════════════════════════════════════════════════
const passwordResetHtml = wrap(`
${hero('🔐', 'Reset Your Password', 'A request was made to reset the password for your <strong style="color:#fff;">{{storeName}}</strong> account.')}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>{{expiry_hours}} hours</strong>.</p>
`)}
${cta('{{reset_url}}', 'Reset My Password')}
${section(`
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-left:4px solid #e8a000;margin-top:24px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-family:'Public Sans',Arial,sans-serif;font-size:13px;color:#888;line-height:1.7;margin:0;">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </td></tr>
  </table>
`)}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 4. ORDER SHIPPED
// ═══════════════════════════════════════════════════════════════════════════════
const orderShippedHtml = wrap(`
${hero('📦', 'Your Order is On the Way!', 'Order <strong style="color:#fff;">#{{order_number}}</strong> has been dispatched and is heading to you.')}
${metaStrip(
  { label: 'Order Number',        value: '#{{order_number}}' },
  { label: 'Tracking Number',     value: '{{tracking_number}}', color: '#1a5c2e' },
  { label: 'Estimated Delivery',  value: '{{estimated_delivery}}' }
)}
${body(`
  <h2 style="${H2}">Hey {{customer_name}} 👋</h2>
  <p style="${P}">Great news! Your order has been dispatched and is on its way to you. Use the tracking number above or click the button below to follow your package.</p>
`)}
${cta('{{tracking_url}}', 'Track My Order')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 5. ORDER DELIVERED
// ═══════════════════════════════════════════════════════════════════════════════
const orderDeliveredHtml = wrap(`
${hero('🎉', 'Your Order Has Been Delivered!', 'Order <strong style="color:#fff;">#{{order_number}}</strong> arrived on {{order_date}}.')}
${metaStrip(
  { label: 'Order Number',   value: '#{{order_number}}' },
  { label: 'Delivered On',   value: '{{delivery_date}}' },
  { label: 'Order Total',    value: '{{order_total}}', color: '#1a5c2e' }
)}
${body(`
  <h2 style="${H2}">Hey {{customer_name}} 👋</h2>
  <p style="${P}">We hope you love your purchase! Your order was delivered on <strong>{{delivery_date}}</strong>. If anything isn't right, please reach us at <a href="mailto:{{supportEmail}}" style="color:#1a5c2e;font-weight:600;">{{supportEmail}}</a> and we'll sort it out.</p>
  <p style="${P}">If you have a moment, we'd love to hear about your experience — reviews help other shoppers make the right choice.</p>
`)}
${cta('{{frontendUrl}}/account', 'Leave a Review', '#e8a000', '#1a1a1a')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 6. ORDER CANCELLED
// ═══════════════════════════════════════════════════════════════════════════════
const orderCancelledHtml = wrap(`
${hero('✕', 'Order Cancelled', 'We\'re sorry, Order <strong style="color:#fff;">#{{order_number}}</strong> has been cancelled.')}
${metaStrip(
  { label: 'Order Number', value: '#{{order_number}}' },
  { label: 'Order Total',  value: '{{order_total}}' }
)}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">We're sorry to let you know that your order has been cancelled. Here's the reason:</p>
`)}
${section(`
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-left:4px solid #dc2626;margin-top:8px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-family:'Public Sans',Arial,sans-serif;font-size:14px;color:#333;line-height:1.7;margin:0;"><strong>Reason:</strong> {{cancellation_reason}}</p>
    </td></tr>
  </table>
  <p style="font-family:'Public Sans',Arial,sans-serif;font-size:14px;color:#888;line-height:1.7;margin:20px 0 0;">If you believe this is a mistake or have any questions, please don't hesitate to contact us — we're happy to help.</p>
`)}
${cta('{{frontendUrl}}', 'Continue Shopping')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 7. ORDER REFUNDED
// ═══════════════════════════════════════════════════════════════════════════════
const orderRefundedHtml = wrap(`
${hero('💰', 'Refund Processed', 'Your refund for Order <strong style="color:#fff;">#{{order_number}}</strong> is on its way.')}
${metaStrip(
  { label: 'Order Number',   value: '#{{order_number}}' },
  { label: 'Refund Amount',  value: '{{refund_amount}}', color: '#1a5c2e' },
  { label: 'Original Total', value: '{{order_total}}' }
)}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">Your refund of <strong style="color:#1a5c2e;">{{refund_amount}}</strong> for Order #{{order_number}} has been processed. Please allow <strong>5–10 business days</strong> for it to appear in your account depending on your bank or payment provider.</p>
  <p style="${P}">If you have any questions about your refund, please don't hesitate to reach out to us.</p>
`)}
${cta('{{frontendUrl}}/account', 'View My Orders')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 8. ORDER NOTE
// ═══════════════════════════════════════════════════════════════════════════════
const orderNoteHtml = wrap(`
${hero('📝', 'A Note About Your Order', 'Regarding Order <strong style="color:#fff;">#{{order_number}}</strong> from {{storeName}}.')}
${metaStrip(
  { label: 'Order Number', value: '#{{order_number}}' }
)}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">Our team has added a note to your order. Please see the message below:</p>
`)}
${section(`
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-left:4px solid #1a5c2e;margin-top:8px;">
    <tr><td style="padding:20px;">
      <p style="font-family:'Public Sans',Arial,sans-serif;font-size:14px;color:#444;line-height:1.8;margin:0;">{{note_content}}</p>
    </td></tr>
  </table>
  <p style="font-family:'Public Sans',Arial,sans-serif;font-size:14px;color:#888;line-height:1.7;margin:20px 0 0;">If you have any questions, reply to this email or reach us at <a href="mailto:{{supportEmail}}" style="color:#1a5c2e;font-weight:600;">{{supportEmail}}</a>.</p>
`)}
${cta('{{order_link}}', 'View My Order')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 9. LAYBYE CREATED
// ═══════════════════════════════════════════════════════════════════════════════
const laybyeCreatedHtml = wrap(`
${hero('💳', 'Laybye Plan Created!', 'Hi <strong style="color:#fff;">{{customer_name}}</strong>, your laybye plan for Order #{{order_number}} is all set up.')}
${metaStrip(
  { label: 'Order Number',   value: '#{{order_number}}' },
  { label: 'Total Amount',   value: '{{total_amount}}', color: '#1a5c2e' },
  { label: 'Deposit Paid',   value: '{{deposit_amount}}' }
)}
${body(`
  <h2 style="${H2}">Hey {{customer_name}} 👋</h2>
  <p style="${P}">Your laybye plan has been successfully created! Here's a full summary of your payment schedule:</p>
`)}
${section(`
  ${sectionHead('Payment Plan Details')}
  ${infoTable([
    { label: 'Plan Name',          value: '{{plan_name}}' },
    { label: 'Total Amount',       value: '{{total_amount}}',       color: '#1a1a1a' },
    { label: 'Deposit Paid',       value: '{{deposit_amount}}',     color: '#1a5c2e' },
    { label: 'Monthly Instalment', value: '{{installment_amount}}', color: '#1a1a1a' },
  ])}
`)}
${cta('{{payment_link}}', 'View Laybye Details')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 10. LAYBYE PAYMENT RECEIVED
// ═══════════════════════════════════════════════════════════════════════════════
const laybyePaymentHtml = wrap(`
${hero('✓', 'Payment Received!', 'Thank you, <strong style="color:#fff;">{{customer_name}}</strong> — your laybye payment for Order #{{order_number}} has been received.')}
${metaStrip(
  { label: 'Payment Amount',    value: '{{payment_amount}}', color: '#1a5c2e' },
  { label: 'Total Paid',        value: '{{paid_amount}}' },
  { label: 'Remaining Balance', value: '{{remaining_balance}}' }
)}
${body(`
  <h2 style="${H2}">Hey {{customer_name}} 👋</h2>
  <p style="${P}">We've received your laybye payment of <strong style="color:#1a5c2e;">{{payment_amount}}</strong>. Here's an updated summary of your plan:</p>
`)}
${section(`
  ${sectionHead('Payment Summary')}
  ${infoTable([
    { label: 'Payment Received',  value: '{{payment_amount}}', color: '#1a5c2e' },
    { label: 'Total Paid to Date', value: '{{paid_amount}}' },
    { label: 'Remaining Balance', value: '{{remaining_balance}}' },
    { label: 'Total Plan Amount', value: '{{total_amount}}' },
  ])}
`)}
${cta('{{payment_link}}', 'View My Laybye')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 11. LAYBYE COMPLETED
// ═══════════════════════════════════════════════════════════════════════════════
const laybyeCompletedHtml = wrap(`
${hero('🎉', 'Laybye Complete!', 'Congratulations <strong style="color:#fff;">{{customer_name}}</strong> — your laybye for Order #{{order_number}} is fully paid!')}
${metaStrip(
  { label: 'Order Number', value: '#{{order_number}}' },
  { label: 'Total Paid',   value: '{{total_amount}}', color: '#1a5c2e' }
)}
${body(`
  <h2 style="${H2}">Congratulations {{customer_name}}! 🎉</h2>
  <p style="${P}">Your laybye of <strong style="color:#1a5c2e;">{{total_amount}}</strong> has been fully paid. Your order is now being processed for fulfilment.</p>
  <p style="${P}">Thank you for your commitment and for shopping with <strong style="color:#1a1a1a;">{{storeName}}</strong>. It truly means the world to us.</p>
`)}
${cta('{{frontendUrl}}/account', 'View My Account')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 12. LAYBYE PAYMENT REMINDER (upcoming)
// ═══════════════════════════════════════════════════════════════════════════════
const laybyeReminderHtml = wrap(`
${hero('⏰', 'Payment Reminder', 'Hi <strong style="color:#fff;">{{customer_name}}</strong>, a gentle reminder about your upcoming laybye payment.')}
${metaStrip(
  { label: 'Order Number',   value: '#{{order_number}}' },
  { label: 'Amount Due',     value: '{{payment_amount}}', color: '#1a5c2e' },
  { label: 'Due Date',       value: '{{payment_date}}' }
)}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">{{message}}</p>
`)}
${section(`
  ${sectionHead('Payment Summary')}
  ${infoTable([
    { label: 'Amount Due',         value: '{{payment_amount}}', color: '#1a5c2e' },
    { label: 'Due Date',           value: '{{payment_date}}' },
    { label: 'Remaining Balance',  value: '{{remaining_balance}}' },
  ])}
`)}
${cta('{{payment_link}}', 'Make Payment Now')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 13. LAYBYE OVERDUE REMINDER
// ═══════════════════════════════════════════════════════════════════════════════
const laybyeOverdueHtml = wrap(`
${hero('⚠️', 'Overdue Payment', 'Hi <strong style="color:#fff;">{{customer_name}}</strong>, your payment for Order #{{order_number}} is overdue.')}
${metaStrip(
  { label: 'Order Number',  value: '#{{order_number}}' },
  { label: 'Amount Due',    value: '{{payment_amount}}', color: '#dc2626' },
  { label: 'Was Due',       value: '{{payment_date}}' }
)}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">{{message}}</p>
  <p style="${P}">Please make your payment as soon as possible to keep your laybye active. If you're experiencing difficulties, please reach out and we'll do our best to assist you.</p>
`)}
${section(`
  ${sectionHead('Outstanding Balance')}
  ${infoTable([
    { label: 'Overdue Amount',     value: '{{payment_amount}}', color: '#dc2626' },
    { label: 'Original Due Date',  value: '{{payment_date}}' },
    { label: 'Remaining Balance',  value: '{{remaining_balance}}' },
  ])}
`)}
${cta('{{payment_link}}', 'Pay Now', '#dc2626')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 14. LAYBYE EXPIRY REMINDER
// ═══════════════════════════════════════════════════════════════════════════════
const laybyeExpiryHtml = wrap(`
${hero('⏳', 'Laybye Expiring Soon', 'Hi <strong style="color:#fff;">{{customer_name}}</strong>, your laybye for Order #{{order_number}} is expiring soon.')}
${metaStrip(
  { label: 'Order Number',   value: '#{{order_number}}' },
  { label: 'Expiry Date',    value: '{{expiry_date}}', color: '#e8a000' },
  { label: 'Amount Due',     value: '{{remaining_balance}}' }
)}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">{{message}}</p>
  <p style="${P}">Please complete your outstanding payments before the expiry date to avoid losing your laybye. Contact us if you need any assistance.</p>
`)}
${section(`
  ${sectionHead('Expiry Details')}
  ${infoTable([
    { label: 'Expiry Date',        value: '{{expiry_date}}',       color: '#e8a000' },
    { label: 'Remaining Balance',  value: '{{remaining_balance}}' },
    { label: 'Plan',               value: '{{plan_name}}' },
  ])}
`)}
${cta('{{payment_link}}', 'Complete Payment')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 15. PROMOTIONAL
// ═══════════════════════════════════════════════════════════════════════════════
const promotionalHtml = wrap(`
${hero('🎁', '{{promo_title}}', '{{promo_subtitle}}')}
${body(`
  <h2 style="${H2}">Hi {{customer_name}},</h2>
  <p style="${P}">{{promo_body}}</p>
`)}
${section(`
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:2px dashed #e8a000;border-radius:10px;background:linear-gradient(135deg,#fffdf5 0%,#fff8e1 100%);margin-top:16px;">
    <tr><td style="padding:28px 32px;text-align:center;">
      <p style="font-family:'Public Sans',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#b07b00;margin:0 0 14px;">🎁 &nbsp;Use this code at checkout</p>
      <table align="center" border="0" cellpadding="0" cellspacing="0">
        <tr><td style="background:#fff;border:1.5px solid #e8e0cc;border-radius:6px;padding:10px 30px;font-family:'Public Sans',Arial,sans-serif;font-size:26px;font-weight:900;letter-spacing:6px;color:#1a5c2e;">{{coupon_code}}</td></tr>
      </table>
    </td></tr>
  </table>
`)}
${cta('{{frontendUrl}}', 'Shop Now', '#e8a000', '#1a1a1a')}
${CONTACTS}
${SPACER}
`);


// ═══════════════════════════════════════════════════════════════════════════════
// 16. REVIEW REMINDER
// ═══════════════════════════════════════════════════════════════════════════════
const reviewReminderHtml = wrap(`
${hero('⭐', 'How Was Your Purchase?', 'Hi <strong style="color:#fff;">{{customer_name}}</strong>, we\'d love to hear about your experience with Order #{{order_number}}.')}
${metaStrip(
  { label: 'Order Number', value: '#{{order_number}}' }
)}
${body(`
  <h2 style="${H2}">Hey {{customer_name}} 👋</h2>
  <p style="${P}">We hope you're enjoying your recent purchase from <strong style="color:#1a1a1a;">{{storeName}}</strong>! Your feedback means everything to us — it helps other shoppers make great decisions and helps us keep improving.</p>
  <p style="${P}">It only takes a minute, and we genuinely appreciate every review.</p>
`)}
${cta('{{review_url}}', 'Write a Review', '#e8a000', '#1a1a1a')}
${CONTACTS}
${SPACER}
`);


// ─── Template definitions ─────────────────────────────────────────────────────
const defaultTemplates = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to {{storeName}}, {{customer_name}}!',
    slug: 'new-account-welcome',
    type: 'new_customer',
    isDefault: true,
    htmlContent: welcomeHtml,
    textContent: 'Welcome to {{storeName}}!\n\nHi {{customer_name}},\n\nThank you for creating an account! Start shopping at {{login_url}}',
    variables: [
      { name: 'customer_name', description: 'Customer full name', example: 'Jane Doe' },
      { name: 'login_url',     description: 'Login page URL',     example: 'https://pesashop.com/login' },
      { name: 'storeName',     description: 'Store name',         example: 'PesaShop' },
      { name: 'supportEmail',  description: 'Support email',      example: 'hello@pesashop.com' },
      { name: 'frontendUrl',   description: 'Store URL',          example: 'https://pesashop.com' },
      { name: 'logoUrl',       description: 'Logo URL',           example: 'https://pesashop.com/logo.png' },
      { name: 'year',          description: 'Current year',       example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Welcome to PesaShop! Your account is ready.',
  },
  {
    name: 'Order Confirmation',
    subject: 'Order Confirmed — #{{order_number}}',
    slug: 'order-confirmation',
    type: 'order_confirmation',
    isDefault: true,
    htmlContent: orderConfirmationHtml,
    textContent: 'Thanks for your order!\n\nOrder #{{order_number}}\nDate: {{order_date}}\nTotal: {{order_total}}\n\nFulfilment: {{delivery_method}}\n{{fulfillment_details}}\n\nTrack: {{order_link}}',
    variables: [
      { name: 'customer_name',       description: 'Customer name',         example: 'Jane Doe' },
      { name: 'order_number',        description: 'Order number',          example: 'ORD-10045' },
      { name: 'order_date',          description: 'Order date',            example: '21 Mar 2026' },
      { name: 'order_total',         description: 'Total amount',          example: 'R 1,250.00' },
      { name: 'subtotal',            description: 'Subtotal',              example: 'R 1,150.00' },
      { name: 'shipping_cost',       description: 'Shipping cost',         example: 'FREE' },
      { name: 'discount',            description: 'Discount amount',       example: '- R 50.00' },
      { name: 'order_items',         description: 'Order items HTML block', example: '<p>Item x 1</p>' },
      { name: 'delivery_method',     description: 'Delivery / pickup',     example: 'Standard Delivery' },
      { name: 'fulfillment_heading', description: '"Delivering To" or "Collecting From"', example: 'Delivering To' },
      { name: 'fulfillment_details', description: 'Address or hub name+address', example: '123 Main St, Harare' },
      { name: 'shipping_address',    description: 'Shipping address',      example: '123 Main St, Harare' },
      { name: 'pickup_hub_name',     description: 'Pickup hub name',       example: 'Main Branch — Harare' },
      { name: 'pickup_hub_address',  description: 'Pickup hub address',    example: '24 Kaguvi St, Harare' },
      { name: 'order_link',          description: 'Link to view order',    example: 'https://pesashop.com/account/orders' },
      { name: 'tracking_url',        description: 'Tracking URL',          example: 'https://pesashop.com/track' },
      { name: 'storeName',     description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail',  description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',   description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',          description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your order has been confirmed!',
  },
  {
    name: 'Password Reset',
    subject: 'Reset Your Password — {{storeName}}',
    slug: 'password-reset',
    type: 'password_reset',
    isDefault: true,
    htmlContent: passwordResetHtml,
    textContent: 'Password Reset\n\nHi {{customer_name}},\n\nReset your password: {{reset_url}}\n\nExpires in {{expiry_hours}} hours.',
    variables: [
      { name: 'customer_name', description: 'Customer name',     example: 'Jane Doe' },
      { name: 'reset_url',     description: 'Password reset URL', example: 'https://pesashop.com/reset?token=abc' },
      { name: 'expiry_hours',  description: 'Link expiry hours', example: '24' },
      { name: 'storeName',     description: 'Store name',        example: 'PesaShop' },
      { name: 'supportEmail',  description: 'Support email',     example: 'hello@pesashop.com' },
      { name: 'frontendUrl',   description: 'Store URL',         example: 'https://pesashop.com' },
      { name: 'year',          description: 'Current year',      example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Reset your PesaShop password',
  },
  {
    name: 'Order Shipped',
    subject: 'Your Order is On the Way — #{{order_number}}',
    slug: 'order-shipped',
    type: 'order_shipped',
    isDefault: true,
    htmlContent: orderShippedHtml,
    textContent: 'Your order #{{order_number}} has been shipped!\n\nTracking: {{tracking_number}}\nEstimated delivery: {{estimated_delivery}}\n\nTrack: {{tracking_url}}',
    variables: [
      { name: 'customer_name',      description: 'Customer name',         example: 'Jane Doe' },
      { name: 'order_number',       description: 'Order number',          example: 'ORD-10045' },
      { name: 'tracking_number',    description: 'Tracking number',       example: 'TRK-123456' },
      { name: 'tracking_url',       description: 'Tracking URL',          example: 'https://pesashop.com/track' },
      { name: 'estimated_delivery', description: 'Estimated delivery date', example: '25 Mar 2026' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your order is on the way!',
  },
  {
    name: 'Order Delivered',
    subject: 'Your Order Has Been Delivered — #{{order_number}}',
    slug: 'order-delivered',
    type: 'order_delivered',
    isDefault: true,
    htmlContent: orderDeliveredHtml,
    textContent: 'Your order #{{order_number}} was delivered on {{delivery_date}}. We hope you love it!',
    variables: [
      { name: 'customer_name',  description: 'Customer name',    example: 'Jane Doe' },
      { name: 'order_number',   description: 'Order number',     example: 'ORD-10045' },
      { name: 'order_total',    description: 'Order total',      example: 'R 1,250.00' },
      { name: 'delivery_date',  description: 'Delivery date',    example: '25 Mar 2026' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your order has been delivered!',
  },
  {
    name: 'Order Cancelled',
    subject: 'Order Cancelled — #{{order_number}}',
    slug: 'order-cancelled',
    type: 'order_cancelled',
    isDefault: true,
    htmlContent: orderCancelledHtml,
    textContent: 'Order #{{order_number}} has been cancelled.\n\nReason: {{cancellation_reason}}',
    variables: [
      { name: 'customer_name',       description: 'Customer name',         example: 'Jane Doe' },
      { name: 'order_number',        description: 'Order number',          example: 'ORD-10045' },
      { name: 'order_total',         description: 'Order total',           example: 'R 1,250.00' },
      { name: 'cancellation_reason', description: 'Cancellation reason',   example: 'Item out of stock' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your order has been cancelled',
  },
  {
    name: 'Order Refunded',
    subject: 'Refund Processed — Order #{{order_number}}',
    slug: 'order-refunded',
    type: 'order_refunded',
    isDefault: true,
    htmlContent: orderRefundedHtml,
    textContent: 'A refund of {{refund_amount}} has been processed for order #{{order_number}}.',
    variables: [
      { name: 'customer_name',  description: 'Customer name',   example: 'Jane Doe' },
      { name: 'order_number',   description: 'Order number',    example: 'ORD-10045' },
      { name: 'order_total',    description: 'Order total',     example: 'R 1,250.00' },
      { name: 'refund_amount',  description: 'Refund amount',   example: 'R 1,250.00' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your refund is being processed',
  },
  {
    name: 'Order Note',
    subject: 'Note About Your Order #{{order_number}}',
    slug: 'order-note',
    type: 'order_note',
    isDefault: true,
    htmlContent: orderNoteHtml,
    textContent: 'A note about your order #{{order_number}}:\n\n{{note_content}}',
    variables: [
      { name: 'customer_name', description: 'Customer name',  example: 'Jane Doe' },
      { name: 'order_number',  description: 'Order number',   example: 'ORD-10045' },
      { name: 'note_content',  description: 'Note text',      example: 'Your order is being held pending address verification.' },
      { name: 'order_link',    description: 'Order link',     example: 'https://pesashop.com/account/orders' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'A note about your order',
  },
  {
    name: 'Laybye Created',
    subject: 'Laybye Plan Created — Order #{{order_number}}',
    slug: 'laybye-created',
    type: 'laybye_created',
    isDefault: true,
    htmlContent: laybyeCreatedHtml,
    textContent: 'Laybye created for order #{{order_number}}\nPlan: {{plan_name}}\nTotal: {{total_amount}}\nDeposit: {{deposit_amount}}\nInstalment: {{installment_amount}}\n\n{{payment_link}}',
    variables: [
      { name: 'customer_name',      description: 'Customer name',       example: 'Jane Doe' },
      { name: 'order_number',       description: 'Order number',        example: 'ORD-10045' },
      { name: 'plan_name',          description: 'Laybye plan name',    example: '3-Month Plan' },
      { name: 'total_amount',       description: 'Total amount',        example: 'R 3,000.00' },
      { name: 'deposit_amount',     description: 'Deposit amount',      example: 'R 600.00' },
      { name: 'installment_amount', description: 'Monthly instalment',  example: 'R 800.00' },
      { name: 'payment_link',       description: 'Laybye details URL',  example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye plan has been created',
  },
  {
    name: 'Laybye Payment Received',
    subject: 'Laybye Payment Received — Order #{{order_number}}',
    slug: 'laybye-payment',
    type: 'laybye_payment',
    isDefault: true,
    htmlContent: laybyePaymentHtml,
    textContent: 'Payment of {{payment_amount}} received for order #{{order_number}}.\nPaid: {{paid_amount}}\nRemaining: {{remaining_balance}}\n\n{{payment_link}}',
    variables: [
      { name: 'customer_name',     description: 'Customer name',     example: 'Jane Doe' },
      { name: 'order_number',      description: 'Order number',      example: 'ORD-10045' },
      { name: 'payment_amount',    description: 'Payment received',  example: 'R 800.00' },
      { name: 'paid_amount',       description: 'Total paid',        example: 'R 1,600.00' },
      { name: 'remaining_balance', description: 'Remaining balance', example: 'R 1,400.00' },
      { name: 'total_amount',      description: 'Total plan amount', example: 'R 3,000.00' },
      { name: 'payment_link',      description: 'Laybye URL',        example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye payment has been received',
  },
  {
    name: 'Laybye Completed',
    subject: 'Laybye Fully Paid — Order #{{order_number}}',
    slug: 'laybye-completed',
    type: 'laybye_completed',
    isDefault: true,
    htmlContent: laybyeCompletedHtml,
    textContent: 'Congratulations! Your laybye for order #{{order_number}} ({{total_amount}}) is fully paid!',
    variables: [
      { name: 'customer_name', description: 'Customer name',    example: 'Jane Doe' },
      { name: 'order_number',  description: 'Order number',     example: 'ORD-10045' },
      { name: 'total_amount',  description: 'Total paid',       example: 'R 3,000.00' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye is fully paid!',
  },
  {
    name: 'Laybye Payment Reminder',
    subject: 'Payment Reminder — Order #{{order_number}}',
    slug: 'laybye-reminder',
    type: 'laybye_reminder',
    isDefault: true,
    htmlContent: laybyeReminderHtml,
    textContent: 'Payment reminder for order #{{order_number}}\n\n{{message}}\n\nAmount: {{payment_amount}}\nDue: {{payment_date}}\n\n{{payment_link}}',
    variables: [
      { name: 'customer_name',     description: 'Customer name',          example: 'Jane Doe' },
      { name: 'order_number',      description: 'Order number',           example: 'ORD-10045' },
      { name: 'message',           description: 'Dynamic reminder message', example: 'Your payment is due in 3 days.' },
      { name: 'payment_amount',    description: 'Amount due',             example: 'R 800.00' },
      { name: 'payment_date',      description: 'Due date',               example: '28 Mar 2026' },
      { name: 'remaining_balance', description: 'Remaining balance',      example: 'R 1,600.00' },
      { name: 'payment_link',      description: 'Payment URL',            example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye payment is due soon',
  },
  {
    name: 'Laybye Overdue Reminder',
    subject: 'Overdue Payment — Order #{{order_number}}',
    slug: 'laybye-overdue-reminder',
    type: 'laybye_overdue_reminder',
    isDefault: true,
    htmlContent: laybyeOverdueHtml,
    textContent: 'Overdue payment for order #{{order_number}}\n\n{{message}}\n\nAmount: {{payment_amount}}\nWas due: {{payment_date}}\n\n{{payment_link}}',
    variables: [
      { name: 'customer_name',     description: 'Customer name',      example: 'Jane Doe' },
      { name: 'order_number',      description: 'Order number',       example: 'ORD-10045' },
      { name: 'message',           description: 'Overdue message',    example: 'Your payment is 5 days overdue.' },
      { name: 'payment_amount',    description: 'Overdue amount',     example: 'R 800.00' },
      { name: 'payment_date',      description: 'Original due date',  example: '20 Mar 2026' },
      { name: 'days_overdue',      description: 'Days overdue',       example: '5' },
      { name: 'remaining_balance', description: 'Remaining balance',  example: 'R 1,600.00' },
      { name: 'payment_link',      description: 'Payment URL',        example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Urgent: overdue laybye payment',
  },
  {
    name: 'Laybye Expiry Reminder',
    subject: 'Laybye Expiring Soon — Order #{{order_number}}',
    slug: 'laybye-expiry-reminder',
    type: 'laybye_expiry_reminder',
    isDefault: true,
    htmlContent: laybyeExpiryHtml,
    textContent: 'Your laybye for order #{{order_number}} expires on {{expiry_date}}.\n\n{{message}}\n\nRemaining: {{remaining_balance}}\n\n{{payment_link}}',
    variables: [
      { name: 'customer_name',     description: 'Customer name',       example: 'Jane Doe' },
      { name: 'order_number',      description: 'Order number',        example: 'ORD-10045' },
      { name: 'message',           description: 'Expiry message',      example: 'Your laybye expires in 7 days.' },
      { name: 'expiry_date',       description: 'Expiry date',         example: '30 Mar 2026' },
      { name: 'days_until_expiry', description: 'Days until expiry',   example: '7' },
      { name: 'remaining_balance', description: 'Remaining balance',   example: 'R 1,600.00' },
      { name: 'plan_name',         description: 'Plan name',           example: '3-Month Plan' },
      { name: 'payment_link',      description: 'Payment URL',         example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye is expiring soon',
  },
  {
    name: 'Promotional Offer',
    subject: '{{promo_title}}',
    slug: 'promotional-offer',
    type: 'promotional',
    isDefault: true,
    htmlContent: promotionalHtml,
    textContent: '{{promo_title}}\n\n{{promo_body}}\n\nUse code: {{coupon_code}}\n\nShop now: {{frontendUrl}}',
    variables: [
      { name: 'customer_name',  description: 'Customer name',    example: 'Jane Doe' },
      { name: 'promo_title',    description: 'Promo headline',   example: 'SAVE 25% This Weekend!' },
      { name: 'promo_subtitle', description: 'Promo subtitle',   example: 'Limited time — ends Sunday' },
      { name: 'promo_body',     description: 'Promo body text',  example: 'Get 25% off everything in store this weekend only.' },
      { name: 'coupon_code',    description: 'Coupon code',      example: 'SAVE25' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'A special offer just for you!',
  },
  {
    name: 'Review Reminder',
    subject: 'How Was Your Purchase? — Order #{{order_number}}',
    slug: 'review-reminder',
    type: 'review_reminder',
    isDefault: true,
    htmlContent: reviewReminderHtml,
    textContent: 'How was your purchase?\n\nHi {{customer_name}},\n\nLeave a review for order #{{order_number}}: {{review_url}}',
    variables: [
      { name: 'customer_name', description: 'Customer name',  example: 'Jane Doe' },
      { name: 'order_number',  description: 'Order number',   example: 'ORD-10045' },
      { name: 'review_url',    description: 'Review URL',     example: 'https://pesashop.com/review/123' },
      { name: 'storeName',    description: 'Store name',    example: 'PesaShop' },
      { name: 'supportEmail', description: 'Support email', example: 'hello@pesashop.com' },
      { name: 'frontendUrl',  description: 'Store URL',     example: 'https://pesashop.com' },
      { name: 'year',         description: 'Current year',  example: '2026' },
    ],
    fromName: 'PesaShop',
    previewText: 'Leave a review for your recent purchase',
  },
];

// ─── Seed function ────────────────────────────────────────────────────────────
// Normal startup: only insert templates whose slug doesn't exist yet (preserves admin customisations).
// Force (re-seed button): upsert all by slug so HTML/variables always reflect latest design.
async function seedEmailTemplates({ force = false } = {}) {
  try {
    if (force) {
      // Upsert every default template by slug — updates HTML on existing, inserts new ones.
      // Does NOT delete custom templates the admin may have added.
      const ops = defaultTemplates.map(t => ({
        updateOne: {
          filter: { slug: t.slug },
          update: { $set: t },
          upsert: true,
        },
      }));
      const result = await EmailTemplate.bulkWrite(ops);
      console.log(`✅ Email templates re-seeded — ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
      return;
    }

    // Soft seed: only add templates whose slug is missing
    const existing = await EmailTemplate.find({}).select('slug');
    const existingSlugs = new Set(existing.map(t => t.slug));
    const missing = defaultTemplates.filter(t => !existingSlugs.has(t.slug));
    if (missing.length === 0) {
      console.log(`✅ Email templates OK — all ${defaultTemplates.length} present`);
      return;
    }
    await EmailTemplate.insertMany(missing);
    console.log(`✅ Email templates seeded — ${missing.length} new templates added`);
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    // Don't throw — must not block server startup
  }
}

module.exports = seedEmailTemplates;
