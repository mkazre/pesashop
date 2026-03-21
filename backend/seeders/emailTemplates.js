const EmailTemplate = require('../models/EmailTemplate');

// ─── Shared HTML wrapper pieces (PesaShop-branded, Fastkart-inspired) ────────
// All templates use inline styles for maximum email-client compatibility.
// Brand: #0F604B primary, #f7bd20 accent, #282834 dark footer.

const HEAD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{subject}}</title>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>`;

const HEADER = `<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f7f7f7;">
  <tr>
    <td style="padding:16px 32px;text-align:left;">
      <a href="{{frontendUrl}}" style="display:inline-block;">
        <img src="{{logoUrl}}" alt="PESASHOP" style="height:40px;width:auto;" />
      </a>
    </td>
    <td style="padding:16px 32px;text-align:right;font-family:'Public Sans',Arial,sans-serif;">
      <a href="{{frontendUrl}}" style="font-size:13px;color:#252525;text-decoration:none;font-weight:500;margin-left:18px;">Shop</a>
      <a href="{{frontendUrl}}/account" style="font-size:13px;color:#252525;text-decoration:none;font-weight:500;margin-left:18px;">My Account</a>
      <a href="{{frontendUrl}}/contact" style="font-size:13px;color:#252525;text-decoration:none;font-weight:500;margin-left:18px;">Contact</a>
    </td>
  </tr>
</table>`;

const FOOTER = `<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#282834;color:#ffffff;padding:28px 24px;font-family:'Public Sans',Arial,sans-serif;">
  <tr><td align="center">
    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px;">
      <tr><td style="font-size:18px;font-weight:700;color:#ffffff;">Shop at <span style="color:#0F604B;">Pesa</span><span style="color:#f7bd20;">Shop</span></td></tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 18px;">
      <tr>
        <td><a href="{{frontendUrl}}/contact" style="font-size:13px;font-weight:600;color:#fff;text-decoration:underline;">Contact Us</a></td>
        <td><a href="{{frontendUrl}}/pages/privacy-policy" style="font-size:13px;font-weight:600;color:#fff;text-decoration:underline;margin-left:20px;">Privacy Policy</a></td>
        <td><a href="{{frontendUrl}}/pages/terms" style="font-size:13px;font-weight:600;color:#fff;text-decoration:underline;margin-left:20px;">Terms &amp; Conditions</a></td>
      </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 18px;">
      <tr>
        <td><a href="https://facebook.com" style="margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/24/733/733547.png" alt="FB" style="width:20px;height:20px;filter:brightness(10);"></a></td>
        <td><a href="https://twitter.com" style="margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/24/733/733579.png" alt="TW" style="width:20px;height:20px;filter:brightness(10);"></a></td>
        <td><a href="https://instagram.com" style="margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/24/733/733558.png" alt="IG" style="width:20px;height:20px;filter:brightness(10);"></a></td>
      </tr>
    </table>
    <p style="font-size:12px;color:#aaa;margin:0;letter-spacing:0.5px;">&copy; {{year}} PesaShop. All rights reserved.</p>
  </td></tr>
</table>`;

function wrap(bodyContent) {
  return `${HEAD}
<body style="margin:0;padding:0;font-family:'Public Sans',Arial,sans-serif;background-color:#e2e2e2;width:100%;-webkit-text-size-adjust:none;">
<table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width:650px;width:100%;margin:20px auto;background-color:#ffffff;box-shadow:0 0 14px -4px rgba(0,0,0,0.17);">
<tbody><tr><td>
${HEADER}
${bodyContent}
${FOOTER}
</td></tr></tbody>
</table>
</body>
</html>`;
}


// ═══════════════════════════════════════════════════════════════════
// 1. WELCOME / NEW ACCOUNT
// ═══════════════════════════════════════════════════════════════════
const welcomeHtml = wrap(`
<!-- Hero banner -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:linear-gradient(135deg,#0F604B 0%,#1a8a6a 100%);padding:50px 40px;text-align:center;">
    <table border="0" cellpadding="0" cellspacing="0" align="center">
      <tr><td align="center">
        <div style="width:80px;height:80px;background:rgba(255,255,255,0.15);border-radius:50%;display:inline-block;line-height:80px;font-size:40px;color:#fff;">&#128075;</div>
      </td></tr>
    </table>
    <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:20px 0 0;font-family:'Public Sans',Arial,sans-serif;">Welcome to PesaShop!</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:10px 0 0;font-weight:400;">We're thrilled to have you join our community</p>
  </td></tr>
</table>

<!-- Body -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:40px 40px 10px;">
  <tr><td>
    <h3 style="font-weight:700;font-size:20px;margin:0 0 8px;color:#222;">Hi {{customer_name}},</h3>
    <p style="font-size:15px;font-weight:400;line-height:1.7;color:#666;margin:0 0 24px;">
      Thank you for creating an account with us! You're now part of the PesaShop family. Here's what you can do:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
      <tr><td style="padding:12px 16px;background:#f7f7f7;border-left:4px solid #0F604B;font-size:14px;color:#333;font-weight:500;">&#10003; &nbsp;Track your orders in real time</td></tr>
      <tr><td style="padding:12px 16px;background:#fff;border-left:4px solid #0F604B;font-size:14px;color:#333;font-weight:500;">&#10003; &nbsp;Save items to your wishlist</td></tr>
      <tr><td style="padding:12px 16px;background:#f7f7f7;border-left:4px solid #0F604B;font-size:14px;color:#333;font-weight:500;">&#10003; &nbsp;Earn PESA Coins with every purchase</td></tr>
      <tr><td style="padding:12px 16px;background:#fff;border-left:4px solid #0F604B;font-size:14px;color:#333;font-weight:500;">&#10003; &nbsp;Get exclusive offers &amp; early access</td></tr>
    </table>
  </td></tr>
</table>

<!-- CTA button -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px 24px;">
  <tr><td align="center">
    <a href="{{login_url}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:15px 40px;font-size:16px;font-weight:700;text-decoration:none;border-radius:6px;font-family:'Public Sans',Arial,sans-serif;">Start Shopping</a>
  </td></tr>
</table>

<!-- Help text -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px 36px;">
  <tr><td>
    <p style="font-size:14px;color:#939393;line-height:1.6;margin:0;text-align:center;">
      If you have any questions, email us at <a href="mailto:{{supportEmail}}" style="color:#0F604B;font-weight:600;">{{supportEmail}}</a>
    </p>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 2. ORDER CONFIRMATION
// ═══════════════════════════════════════════════════════════════════
const orderConfirmationHtml = wrap(`
<!-- Success banner -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:30px;">
  <tr><td align="center">
    <div style="width:90px;height:90px;background:#e6f7f1;border-radius:50%;display:inline-block;line-height:90px;font-size:48px;color:#0F604B;">&#10004;</div>
    <h2 style="font-size:22px;font-weight:700;margin:20px 0 6px;color:#222;">Thanks for your Order!</h2>
    <p style="font-size:14px;color:#939393;font-weight:500;margin:0;max-width:400px;">
      You'll receive a shipping confirmation email when your items are on the way.
    </p>
  </td></tr>
</table>

<!-- Delivery & Payment info -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 30px;padding:20px 32px;width:calc(100% - 60px);background-color:#f7f7f7;">
  <tr>
    <td style="text-align:left;padding-right:24px;border-right:2px solid rgba(217,217,217,0.5);vertical-align:top;width:50%;">
      <h4 style="font-size:15px;font-weight:700;margin:0 0 8px;color:#222;">Shipping Address</h4>
      <p style="font-size:13px;margin:0;line-height:1.6;color:#666;font-weight:400;">{{shipping_address}}</p>
    </td>
    <td style="text-align:left;padding-left:24px;vertical-align:top;width:50%;">
      <h4 style="font-size:15px;font-weight:700;margin:0 0 8px;color:#222;">Order Info</h4>
      <p style="font-size:13px;margin:0;line-height:1.6;color:#666;">
        <strong>Order:</strong> #{{order_number}}<br>
        <strong>Date:</strong> {{order_date}}<br>
        <strong>Method:</strong> {{delivery_method}}
      </p>
    </td>
  </tr>
</table>

<!-- Order items -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:28px 30px 0;">
  <tr><th style="font-size:16px;font-weight:700;padding-bottom:10px;border-bottom:1px solid rgba(217,217,217,0.5);text-align:left;">Order Items</th></tr>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 30px;">
  <tr><td>{{order_items}}</td></tr>
</table>

<!-- Order summary -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 30px 0;">
  <tr><td>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f7f7f7;padding:16px;">
      <tr>
        <td style="text-align:left;font-size:14px;font-weight:400;padding:10px 0;border-bottom:1px solid rgba(217,217,217,0.5);">Subtotal</td>
        <td style="text-align:right;font-size:14px;font-weight:400;padding:10px 0;border-bottom:1px solid rgba(217,217,217,0.5);">{{subtotal}}</td>
      </tr>
      <tr>
        <td style="text-align:left;font-size:14px;font-weight:400;padding:10px 0;border-bottom:1px solid rgba(217,217,217,0.5);">Shipping</td>
        <td style="text-align:right;font-size:14px;font-weight:400;padding:10px 0;border-bottom:1px solid rgba(217,217,217,0.5);">{{shipping_cost}}</td>
      </tr>
      <tr>
        <td style="text-align:left;font-size:16px;font-weight:700;padding-top:12px;color:#222;">Total</td>
        <td style="text-align:right;font-size:16px;font-weight:700;padding-top:12px;color:#0F604B;">{{order_total}}</td>
      </tr>
    </table>
  </td></tr>
</table>

<!-- CTA -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:28px 30px 36px;">
  <tr><td align="center">
    <a href="{{tracking_url}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;font-family:'Public Sans',Arial,sans-serif;">Track Your Order</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 3. PASSWORD RESET
// ═══════════════════════════════════════════════════════════════════
const passwordResetHtml = wrap(`
<!-- Lock icon -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:44px 40px 0;">
  <tr><td align="center">
    <div style="width:80px;height:80px;background:#fff3e0;border-radius:50%;display:inline-block;line-height:80px;font-size:40px;">&#128274;</div>
  </td></tr>
</table>

<!-- Content -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 50px 0;">
  <tr><td align="center">
    <h2 style="font-weight:700;font-size:22px;margin:0 0 6px;color:#222;">Reset Your Password</h2>
    <h3 style="font-weight:600;font-size:16px;margin:0 0 16px;color:#939393;">Hi {{customer_name}},</h3>
    <p style="font-size:15px;font-weight:400;line-height:1.7;color:#666;margin:0 auto;max-width:420px;">
      We received a request to reset your password. Click the button below to create a new one. This link expires in {{expiry_hours}} hours.
    </p>
  </td></tr>
</table>

<!-- CTA Button -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:30px 40px;">
  <tr><td align="center">
    <a href="{{reset_url}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:16px 40px;font-size:17px;font-weight:700;text-decoration:none;border-radius:6px;font-family:'Public Sans',Arial,sans-serif;">Set a New Password</a>
  </td></tr>
</table>

<!-- Disclaimer -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 50px 40px;">
  <tr><td align="center">
    <p style="font-size:14px;font-weight:400;line-height:1.7;color:#939393;margin:0 auto;max-width:420px;">
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </p>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 4. ORDER SHIPPED
// ═══════════════════════════════════════════════════════════════════
const orderShippedHtml = wrap(`
<!-- Truck banner -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:linear-gradient(135deg,#0F604B 0%,#1a8a6a 100%);padding:44px 40px;text-align:center;">
    <div style="font-size:50px;color:#fff;margin-bottom:10px;">&#128666;</div>
    <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;font-family:'Public Sans',Arial,sans-serif;">Your Order is On the Way!</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:10px 0 0;">Order #{{order_number}} has been shipped</p>
  </td></tr>
</table>

<!-- Body -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px 10px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">
      Great news! Your order has been dispatched and is on its way to you. Here are your tracking details:
    </p>
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background:#f7f7f7;margin:0 0 24px;">
      <tr>
        <td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Tracking Number</td>
        <td style="font-size:14px;text-align:right;border-bottom:1px solid #e9e9e9;color:#0F604B;font-weight:700;">{{tracking_number}}</td>
      </tr>
      <tr>
        <td style="font-size:14px;font-weight:600;">Estimated Delivery</td>
        <td style="font-size:14px;text-align:right;color:#333;">{{estimated_delivery}}</td>
      </tr>
    </table>
  </td></tr>
</table>

<!-- CTA -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px 40px;">
  <tr><td align="center">
    <a href="{{tracking_url}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Track Your Package</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 5. ORDER DELIVERED
// ═══════════════════════════════════════════════════════════════════
const orderDeliveredHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:#e6f7f1;padding:44px 40px;text-align:center;">
    <div style="font-size:50px;margin-bottom:10px;">&#127881;</div>
    <h1 style="color:#0F604B;font-size:24px;font-weight:800;margin:0;">Your Order Has Been Delivered!</h1>
    <p style="color:#666;font-size:14px;margin:10px 0 0;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px 10px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">
      Your order has been delivered on <strong>{{delivery_date}}</strong>. We hope you love your items!
    </p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">
      If you have a moment, we'd love to hear about your experience. Leave a review and help other shoppers make the right choice.
    </p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px 40px;">
  <tr><td align="center">
    <a href="{{frontendUrl}}/account" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Leave a Review</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 6. ORDER CANCELLED
// ═══════════════════════════════════════════════════════════════════
const orderCancelledHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:#fef2f2;padding:44px 40px;text-align:center;">
    <div style="font-size:50px;margin-bottom:10px;">&#10060;</div>
    <h1 style="color:#dc2626;font-size:24px;font-weight:800;margin:0;">Order Cancelled</h1>
    <p style="color:#666;font-size:14px;margin:10px 0 0;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px 10px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 16px;">
      We're sorry to inform you that your order #{{order_number}} ({{order_total}}) has been cancelled.
    </p>
    <table border="0" cellpadding="14" cellspacing="0" width="100%" style="background:#fef2f2;margin:0 0 24px;border-left:4px solid #dc2626;">
      <tr><td style="font-size:14px;color:#333;"><strong>Reason:</strong> {{cancellation_reason}}</td></tr>
    </table>
    <p style="font-size:14px;color:#939393;line-height:1.7;margin:0;">
      If you have any questions about this cancellation, please contact us at <a href="mailto:{{supportEmail}}" style="color:#0F604B;font-weight:600;">{{supportEmail}}</a>.
    </p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:16px 40px 40px;">
  <tr><td align="center">
    <a href="{{frontendUrl}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Continue Shopping</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 7. ORDER REFUNDED
// ═══════════════════════════════════════════════════════════════════
const orderRefundedHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:#eff6ff;padding:44px 40px;text-align:center;">
    <div style="font-size:50px;margin-bottom:10px;">&#128176;</div>
    <h1 style="color:#2563eb;font-size:24px;font-weight:800;margin:0;">Refund Processed</h1>
    <p style="color:#666;font-size:14px;margin:10px 0 0;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 20px;">
      A refund of <strong style="color:#0F604B;">{{refund_amount}}</strong> has been processed for your order #{{order_number}}. Please allow 5-10 business days for the refund to appear in your account.
    </p>
    <p style="font-size:14px;color:#939393;line-height:1.7;margin:0;">
      If you have questions, contact us at <a href="mailto:{{supportEmail}}" style="color:#0F604B;font-weight:600;">{{supportEmail}}</a>.
    </p>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 8. ORDER NOTE
// ═══════════════════════════════════════════════════════════════════
const orderNoteHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px 0;">
  <tr><td>
    <h2 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#222;">A Note About Your Order</h2>
    <p style="font-size:13px;color:#999;margin:0 0 20px;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <table border="0" cellpadding="18" cellspacing="0" width="100%" style="background:#f7f7f7;border-left:4px solid #0F604B;margin:0 0 24px;">
      <tr><td style="font-size:14px;color:#444;line-height:1.7;">{{note_content}}</td></tr>
    </table>
    <p style="font-size:14px;color:#939393;line-height:1.7;margin:0;">
      If you have questions, reply to this email or contact us at <a href="mailto:{{supportEmail}}" style="color:#0F604B;">{{supportEmail}}</a>.
    </p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:28px 40px 40px;">
  <tr><td align="center">
    <a href="{{frontendUrl}}/account" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">View Your Order</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 9. LAYBYE CREATED
// ═══════════════════════════════════════════════════════════════════
const laybyeCreatedHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:linear-gradient(135deg,#0F604B 0%,#1a8a6a 100%);padding:44px 40px;text-align:center;">
    <div style="font-size:50px;color:#fff;margin-bottom:10px;">&#128179;</div>
    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;">Laybye Plan Created!</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:10px 0 0;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px 10px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">Your laybye plan has been set up successfully. Here are your payment details:</p>
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background:#f7f7f7;">
      <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Plan</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">{{plan_name}}</td></tr>
      <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Total Amount</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">{{total_amount}}</td></tr>
      <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Deposit Paid</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;color:#0F604B;font-weight:700;">{{deposit_amount}}</td></tr>
      <tr><td style="font-size:14px;font-weight:600;">Monthly Instalment</td><td style="text-align:right;font-size:14px;font-weight:700;">{{installment_amount}}</td></tr>
    </table>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 40px 40px;">
  <tr><td align="center">
    <a href="{{payment_link}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">View Laybye Details</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 10. LAYBYE PAYMENT RECEIVED
// ═══════════════════════════════════════════════════════════════════
const laybyePaymentHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:44px 40px 0;">
  <tr><td align="center">
    <div style="width:80px;height:80px;background:#e6f7f1;border-radius:50%;display:inline-block;line-height:80px;font-size:40px;color:#0F604B;">&#10004;</div>
    <h2 style="font-size:22px;font-weight:700;margin:16px 0 6px;color:#222;">Payment Received!</h2>
    <p style="font-size:14px;color:#666;margin:0;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:28px 40px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">We've received your laybye payment. Here's a summary:</p>
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background:#f7f7f7;">
      <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Payment Amount</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;color:#0F604B;font-weight:700;">{{payment_amount}}</td></tr>
      <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Total Paid</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">{{paid_amount}}</td></tr>
      <tr><td style="font-size:14px;font-weight:600;">Remaining Balance</td><td style="text-align:right;font-size:14px;font-weight:700;">{{remaining_balance}}</td></tr>
    </table>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px 40px;">
  <tr><td align="center">
    <a href="{{payment_link}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">View Laybye</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 11. LAYBYE COMPLETED
// ═══════════════════════════════════════════════════════════════════
const laybyeCompletedHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:linear-gradient(135deg,#0F604B 0%,#1a8a6a 100%);padding:50px 40px;text-align:center;">
    <div style="font-size:50px;color:#fff;margin-bottom:10px;">&#127881;</div>
    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;">Laybye Complete!</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:10px 0 0;">All payments received for Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 16px;">
      Congratulations! Your laybye of <strong style="color:#0F604B;">{{total_amount}}</strong> has been fully paid. Your order will now be processed for shipping.
    </p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0;">Thank you for shopping with PesaShop!</p>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 12. LAYBYE REMINDER (upcoming / overdue / expiry)
// ═══════════════════════════════════════════════════════════════════
const laybyeReminderHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:#fff7ed;padding:44px 40px;text-align:center;">
    <div style="font-size:50px;margin-bottom:10px;">&#9200;</div>
    <h1 style="color:#ea580c;font-size:24px;font-weight:800;margin:0;">Payment Reminder</h1>
    <p style="color:#666;font-size:14px;margin:10px 0 0;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">{{message}}</p>
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background:#f7f7f7;">
      <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Amount Due</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;color:#ea580c;font-weight:700;">{{payment_amount}}</td></tr>
      <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Due Date</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">{{payment_date}}</td></tr>
      <tr><td style="font-size:14px;font-weight:600;">Remaining Balance</td><td style="text-align:right;font-size:14px;">{{remaining_balance}}</td></tr>
    </table>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px 40px;">
  <tr><td align="center">
    <a href="{{payment_link}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Make Payment Now</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 13. PROMOTIONAL / OFFER
// ═══════════════════════════════════════════════════════════════════
const promotionalHtml = wrap(`
<!-- Hero banner -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="background:linear-gradient(135deg,#0F604B 0%,#1a8a6a 50%,#f7bd20 100%);padding:50px 40px;text-align:center;">
    <h1 style="color:#fff;font-size:36px;font-weight:900;margin:0;font-family:'Public Sans',Arial,sans-serif;">{{promo_title}}</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:12px 0 0;font-weight:400;">{{promo_subtitle}}</p>
  </td></tr>
</table>

<!-- Content -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:36px 40px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">{{promo_body}}</p>
  </td></tr>
</table>

<!-- Coupon Code -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px;">
  <tr><td align="center">
    <table border="0" cellpadding="0" cellspacing="0" style="border:2px dashed #0F604B;border-radius:50px;padding:14px 48px;margin:0 auto;">
      <tr><td style="font-size:18px;font-weight:700;color:#0F604B;letter-spacing:2px;font-family:'Public Sans',Arial,sans-serif;">{{coupon_code}}</td></tr>
    </table>
  </td></tr>
</table>

<!-- CTA -->
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:28px 40px 40px;">
  <tr><td align="center">
    <a href="{{frontendUrl}}" style="display:inline-block;background-color:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Shop Now</a>
  </td></tr>
</table>
`);


// ═══════════════════════════════════════════════════════════════════
// 14. REVIEW REMINDER
// ═══════════════════════════════════════════════════════════════════
const reviewReminderHtml = wrap(`
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:44px 40px 0;">
  <tr><td align="center">
    <div style="font-size:48px;margin-bottom:10px;">&#11088;</div>
    <h2 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#222;">How Was Your Purchase?</h2>
    <p style="font-size:14px;color:#939393;margin:0;">Order #{{order_number}}</p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:28px 40px;">
  <tr><td>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">Hi {{customer_name}},</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">
      We hope you're enjoying your recent purchase! Your feedback helps other shoppers and helps us improve. Take a moment to leave a review.
    </p>
  </td></tr>
</table>

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0 40px 40px;">
  <tr><td align="center">
    <a href="{{review_url}}" style="display:inline-block;background-color:#f7bd20;color:#000;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">Write a Review</a>
  </td></tr>
</table>
`);


// ─── Template definitions array ─────────────────────────────────
const defaultTemplates = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to PesaShop, {{customer_name}}!',
    slug: 'new-account-welcome',
    type: 'new_customer',
    isDefault: true,
    htmlContent: welcomeHtml,
    textContent: 'Welcome to PesaShop!\n\nHi {{customer_name}},\n\nThank you for creating an account! Start shopping at {{login_url}}',
    variables: [
      { name: 'customer_name', description: 'Customer full name', example: 'John Doe' },
      { name: 'login_url', description: 'Login page URL', example: 'https://pesashop.com/login' },
      { name: 'shop_url', description: 'Store homepage URL', example: 'https://pesashop.com' },
      { name: 'supportEmail', description: 'Support email', example: 'support@pesashop.com' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo image URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Welcome to PesaShop! Start shopping today.'
  },
  {
    name: 'Order Confirmation',
    subject: 'Order Confirmed — #{{order_number}}',
    slug: 'order-confirmation',
    type: 'order_confirmation',
    isDefault: true,
    htmlContent: orderConfirmationHtml,
    textContent: 'Thanks for your order!\n\nOrder #{{order_number}}\nDate: {{order_date}}\nTotal: {{order_total}}\n\nShipping Address: {{shipping_address}}\n\nTrack: {{tracking_url}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'order_date', description: 'Order date', example: '21 Mar 2026' },
      { name: 'order_total', description: 'Total amount', example: 'R 1,250.00' },
      { name: 'order_items', description: 'Order items HTML', example: '<p>Item x 1</p>' },
      { name: 'subtotal', description: 'Subtotal', example: 'R 1,150.00' },
      { name: 'shipping_cost', description: 'Shipping cost', example: 'R 100.00' },
      { name: 'shipping_address', description: 'Shipping address', example: '123 Main St, Johannesburg' },
      { name: 'delivery_method', description: 'Delivery method', example: 'Standard Delivery' },
      { name: 'tracking_url', description: 'Order tracking URL', example: 'https://pesashop.com/track' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your order has been confirmed!'
  },
  {
    name: 'Password Reset',
    subject: 'Reset Your Password — PesaShop',
    slug: 'password-reset',
    type: 'password_reset',
    isDefault: true,
    htmlContent: passwordResetHtml,
    textContent: 'Password Reset\n\nHi {{customer_name}},\n\nClick the link to reset your password: {{reset_url}}\n\nThis link expires in {{expiry_hours}} hours.',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'reset_url', description: 'Password reset URL', example: 'https://pesashop.com/reset?token=abc' },
      { name: 'expiry_hours', description: 'Link expiry hours', example: '24' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Reset your PesaShop password'
  },
  {
    name: 'Order Shipped',
    subject: 'Your Order Has Been Shipped — #{{order_number}}',
    slug: 'order-shipped',
    type: 'order_shipped',
    isDefault: true,
    htmlContent: orderShippedHtml,
    textContent: 'Your order #{{order_number}} has been shipped!\n\nTracking: {{tracking_number}}\nEstimated delivery: {{estimated_delivery}}\n\nTrack: {{tracking_url}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'tracking_number', description: 'Tracking number', example: 'TRK-123456' },
      { name: 'tracking_url', description: 'Tracking URL', example: 'https://pesashop.com/track' },
      { name: 'estimated_delivery', description: 'Estimated delivery date', example: '25 Mar 2026' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your order is on the way!'
  },
  {
    name: 'Order Delivered',
    subject: 'Your Order Has Been Delivered — #{{order_number}}',
    slug: 'order-delivered',
    type: 'order_delivered',
    isDefault: true,
    htmlContent: orderDeliveredHtml,
    textContent: 'Your order #{{order_number}} has been delivered on {{delivery_date}}!',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'order_total', description: 'Order total', example: 'R 1,250.00' },
      { name: 'delivery_date', description: 'Delivery date', example: '25 Mar 2026' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your order has been delivered!'
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
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'order_total', description: 'Order total', example: 'R 1,250.00' },
      { name: 'cancellation_reason', description: 'Cancellation reason', example: 'Out of stock' },
      { name: 'supportEmail', description: 'Support email', example: 'support@pesashop.com' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your order has been cancelled'
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
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'order_total', description: 'Original order total', example: 'R 1,250.00' },
      { name: 'refund_amount', description: 'Refund amount', example: 'R 1,250.00' },
      { name: 'supportEmail', description: 'Support email', example: 'support@pesashop.com' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your refund has been processed'
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
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'note_content', description: 'Note message', example: 'Your order is being prepared.' },
      { name: 'supportEmail', description: 'Support email', example: 'support@pesashop.com' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'A note about your order'
  },
  {
    name: 'Laybye Created',
    subject: 'Laybye Plan Created — Order #{{order_number}}',
    slug: 'laybye-created',
    type: 'laybye_created',
    isDefault: true,
    htmlContent: laybyeCreatedHtml,
    textContent: 'Laybye created for order #{{order_number}}\nTotal: {{total_amount}}\nDeposit: {{deposit_amount}}\nInstalment: {{installment_amount}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'plan_name', description: 'Laybye plan name', example: '3 Month Plan' },
      { name: 'total_amount', description: 'Total amount', example: 'R 3,000.00' },
      { name: 'deposit_amount', description: 'Deposit amount', example: 'R 1,000.00' },
      { name: 'installment_amount', description: 'Monthly instalment', example: 'R 500.00' },
      { name: 'payment_link', description: 'Payment link', example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye plan has been created'
  },
  {
    name: 'Laybye Payment Received',
    subject: 'Laybye Payment Received — Order #{{order_number}}',
    slug: 'laybye-payment',
    type: 'laybye_payment',
    isDefault: true,
    htmlContent: laybyePaymentHtml,
    textContent: 'Payment of {{payment_amount}} received for order #{{order_number}}.\nPaid: {{paid_amount}}\nRemaining: {{remaining_balance}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'payment_amount', description: 'Payment amount', example: 'R 500.00' },
      { name: 'paid_amount', description: 'Total paid so far', example: 'R 1,500.00' },
      { name: 'remaining_balance', description: 'Remaining balance', example: 'R 1,500.00' },
      { name: 'total_amount', description: 'Total amount', example: 'R 3,000.00' },
      { name: 'payment_link', description: 'Payment link', example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye payment has been received'
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
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'total_amount', description: 'Total amount', example: 'R 3,000.00' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye is fully paid!'
  },
  {
    name: 'Laybye Payment Reminder',
    subject: 'Payment Reminder — Order #{{order_number}}',
    slug: 'laybye-reminder',
    type: 'laybye_reminder',
    isDefault: true,
    htmlContent: laybyeReminderHtml,
    textContent: 'Payment reminder for order #{{order_number}}\n\n{{message}}\n\nAmount: {{payment_amount}}\nDue: {{payment_date}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'message', description: 'Reminder message', example: 'Your next payment is due in 3 days.' },
      { name: 'payment_amount', description: 'Payment amount', example: 'R 500.00' },
      { name: 'payment_date', description: 'Payment due date', example: '25 Mar 2026' },
      { name: 'remaining_balance', description: 'Remaining balance', example: 'R 1,500.00' },
      { name: 'payment_link', description: 'Payment link', example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Laybye payment reminder'
  },
  {
    name: 'Laybye Overdue Reminder',
    subject: 'Overdue Payment — Order #{{order_number}}',
    slug: 'laybye-overdue-reminder',
    type: 'laybye_overdue_reminder',
    isDefault: true,
    htmlContent: laybyeReminderHtml,
    textContent: 'Overdue payment for order #{{order_number}}\n\n{{message}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'message', description: 'Overdue message', example: 'Your payment is 5 days overdue.' },
      { name: 'payment_amount', description: 'Payment amount', example: 'R 500.00' },
      { name: 'payment_date', description: 'Original due date', example: '20 Mar 2026' },
      { name: 'remaining_balance', description: 'Remaining balance', example: 'R 1,500.00' },
      { name: 'payment_link', description: 'Payment link', example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Overdue laybye payment'
  },
  {
    name: 'Laybye Expiry Reminder',
    subject: 'Laybye Expiring Soon — Order #{{order_number}}',
    slug: 'laybye-expiry-reminder',
    type: 'laybye_expiry_reminder',
    isDefault: true,
    htmlContent: laybyeReminderHtml,
    textContent: 'Your laybye for order #{{order_number}} is expiring soon.\n\n{{message}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'message', description: 'Expiry message', example: 'Your laybye expires in 7 days.' },
      { name: 'payment_amount', description: 'Payment amount', example: 'R 500.00' },
      { name: 'payment_date', description: 'Payment due date', example: '28 Mar 2026' },
      { name: 'remaining_balance', description: 'Remaining balance', example: 'R 1,500.00' },
      { name: 'payment_link', description: 'Payment link', example: 'https://pesashop.com/account/laybyes/123' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Your laybye is expiring soon'
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
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'promo_title', description: 'Promo headline', example: 'SAVE 25% This Weekend!' },
      { name: 'promo_subtitle', description: 'Promo subtitle', example: 'Limited time offer — ends Sunday' },
      { name: 'promo_body', description: 'Promo body text', example: 'Get 25% off everything in store!' },
      { name: 'coupon_code', description: 'Coupon code', example: 'SAVE25' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'A special offer just for you!'
  },
  {
    name: 'Review Reminder',
    subject: 'How Was Your Purchase? — Order #{{order_number}}',
    slug: 'review-reminder',
    type: 'review_reminder',
    isDefault: true,
    htmlContent: reviewReminderHtml,
    textContent: 'How was your purchase?\n\nHi {{customer_name}},\n\nPlease leave a review for order #{{order_number}}: {{review_url}}',
    variables: [
      { name: 'customer_name', description: 'Customer name', example: 'John Doe' },
      { name: 'order_number', description: 'Order number', example: 'ORD-10045' },
      { name: 'review_url', description: 'Review URL', example: 'https://pesashop.com/review/123' },
      { name: 'frontendUrl', description: 'Frontend base URL', example: 'https://pesashop.com' },
      { name: 'logoUrl', description: 'Logo URL', example: 'https://pesashop.com/logo.png' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'PesaShop',
    previewText: 'Leave a review for your recent purchase'
  },
];

async function seedEmailTemplates() {
  try {
    await EmailTemplate.deleteMany({});
    await EmailTemplate.insertMany(defaultTemplates);
    console.log(`✅ Email templates seeded successfully (${defaultTemplates.length} templates)`);
  } catch (error) {
    console.error('Error seeding email templates:', error);
    throw error;
  }
}

module.exports = seedEmailTemplates;
