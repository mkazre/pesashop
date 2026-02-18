const EmailTemplate = require('../models/EmailTemplate');

const defaultTemplates = [
  {
    name: 'Order Confirmation',
    subject: 'Order Confirmation - Order #{{orderNumber}}',
    slug: 'order-confirmation',
    type: 'order_confirmation',
    isDefault: true,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
          <tr>
            <td style="background-color: #0e604a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">{{storeName}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #0e604a; margin: 0 0 20px 0;">Thank You For Your Order!</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi {{customerName}},</p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">We've received your order and it's being processed. Here are your order details:</p>
              <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f9f9f9; margin: 20px 0;">
                <tr>
                  <td style="border-bottom: 1px solid #e0e0e0;"><strong>Order Number:</strong></td>
                  <td style="text-align: right; border-bottom: 1px solid #e0e0e0;">{{orderNumber}}</td>
                </tr>
                <tr>
                  <td style="border-bottom: 1px solid #e0e0e0;"><strong>Order Date:</strong></td>
                  <td style="text-align: right; border-bottom: 1px solid #e0e0e0;">{{orderDate}}</td>
                </tr>
                <tr>
                  <td><strong>Total Amount:</strong></td>
                  <td style="text-align: right; font-size: 18px; font-weight: bold; color: #0e604a;">{{orderTotal}}</td>
                </tr>
              </table>
              <h3 style="color: #0e604a; margin: 30px 0 15px 0;">Order Items</h3>
              {{orderItems}}
              <h3 style="color: #0e604a; margin: 30px 0 15px 0;">Shipping Address</h3>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">{{shippingAddress}}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{orderLink}}" style="background-color: #f7bd20; color: #000000; padding: 15px 40px; text-decoration: none; font-weight: bold; display: inline-block;">View Order Details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">Questions? Contact us at {{supportEmail}}</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">&copy; {{year}} {{storeName}}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textContent: `Order Confirmation - {{storeName}}

Thank you for your order!

Order Number: {{orderNumber}}
Order Date: {{orderDate}}
Total Amount: {{orderTotal}}

Shipping Address:
{{shippingAddress}}

View your order: {{orderLink}}

Questions? Contact us at {{supportEmail}}`,
    variables: [
      { name: 'storeName', description: 'Store name', example: 'My Store' },
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'orderNumber', description: 'Order number', example: '#12345' },
      { name: 'orderDate', description: 'Order date', example: 'Jan 24, 2026' },
      { name: 'orderTotal', description: 'Order total', example: 'R1,500.00' },
      { name: 'orderItems', description: 'Order items HTML', example: '<p>Product 1 x 2</p>' },
      { name: 'shippingAddress', description: 'Shipping address', example: '123 Main St, City' },
      { name: 'orderLink', description: 'Link to order details', example: 'https://yourstore.com/orders/12345' },
      { name: 'supportEmail', description: 'Support email', example: 'support@yourstore.com' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'Your Store',
    previewText: 'Your order has been confirmed'
  },
  {
    name: 'New Account Welcome',
    subject: 'Welcome to {{storeName}}!',
    slug: 'new-account',
    type: 'new_account',
    isDefault: true,
    htmlContent: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
          <tr>
            <td style="background-color: #0e604a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Welcome to {{storeName}}!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #0e604a;">Hi {{customerName}},</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.6;">Thank you for creating an account with us! We're excited to have you as part of our community.</p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6;">You can now:</p>
              <ul style="color: #333333; font-size: 16px; line-height: 1.8;">
                <li>Track your orders</li>
                <li>Save items to your wishlist</li>
                <li>Earn PESA Coins</li>
                <li>Get exclusive offers</li>
              </ul>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{loginLink}}" style="background-color: #f7bd20; color: #000000; padding: 15px 40px; text-decoration: none; font-weight: bold; display: inline-block;">Start Shopping</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0;">&copy; {{year}} {{storeName}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textContent: 'Welcome to {{storeName}}!\n\nHi {{customerName}},\n\nThank you for creating an account!',
    variables: [
      { name: 'storeName', description: 'Store name', example: 'My Store' },
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'loginLink', description: 'Login link', example: 'https://yourstore.com/login' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'Your Store',
    previewText: 'Welcome! Your account has been created'
  },
  {
    name: 'Laybye Created',
    subject: 'Laybye Plan Created - {{laybyeNumber}}',
    slug: 'laybye-created',
    type: 'laybye_created',
    isDefault: true,
    htmlContent: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
          <tr>
            <td style="background-color: #0e604a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Laybye Plan Created</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #0e604a;">Hi {{customerName}},</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.6;">Your laybye plan has been created successfully!</p>
              <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f9f9f9; margin: 20px 0;">
                <tr>
                  <td><strong>Laybye Number:</strong></td>
                  <td style="text-align: right;">{{laybyeNumber}}</td>
                </tr>
                <tr>
                  <td><strong>Total Amount:</strong></td>
                  <td style="text-align: right;">{{totalAmount}}</td>
                </tr>
                <tr>
                  <td><strong>Deposit Paid:</strong></td>
                  <td style="text-align: right;">{{depositAmount}}</td>
                </tr>
                <tr>
                  <td><strong>Remaining Balance:</strong></td>
                  <td style="text-align: right; font-weight: bold; color: #0e604a;">{{remainingBalance}}</td>
                </tr>
                <tr>
                  <td><strong>Next Payment Date:</strong></td>
                  <td style="text-align: right;">{{nextPaymentDate}}</td>
                </tr>
                <tr>
                  <td><strong>Next Payment Amount:</strong></td>
                  <td style="text-align: right;">{{nextPaymentAmount}}</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{laybyeLink}}" style="background-color: #f7bd20; color: #000000; padding: 15px 40px; text-decoration: none; font-weight: bold; display: inline-block;">View Laybye Details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0;">&copy; {{year}} {{storeName}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textContent: 'Laybye Plan Created\n\nLaybye Number: {{laybyeNumber}}\nTotal: {{totalAmount}}\nRemaining: {{remainingBalance}}',
    variables: [
      { name: 'storeName', description: 'Store name', example: 'My Store' },
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'laybyeNumber', description: 'Laybye number', example: '#LAY-12345' },
      { name: 'totalAmount', description: 'Total amount', example: 'R5,000.00' },
      { name: 'depositAmount', description: 'Deposit amount', example: 'R1,000.00' },
      { name: 'remainingBalance', description: 'Remaining balance', example: 'R4,000.00' },
      { name: 'nextPaymentDate', description: 'Next payment date', example: 'Feb 24, 2026' },
      { name: 'nextPaymentAmount', description: 'Next payment amount', example: 'R1,000.00' },
      { name: 'laybyeLink', description: 'Link to laybye details', example: 'https://yourstore.com/laybyes/12345' },
      { name: 'year', description: 'Current year', example: '2026' }
    ],
    fromName: 'Your Store',
    previewText: 'Your laybye plan has been created'
  }
];

async function seedEmailTemplates() {
  try {
    await EmailTemplate.deleteMany({});
    await EmailTemplate.insertMany(defaultTemplates);
    console.log('✅ Email templates seeded successfully');
  } catch (error) {
    console.error('Error seeding email templates:', error);
    throw error;
  }
}

module.exports = seedEmailTemplates;
