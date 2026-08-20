import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { emailTemplatesAPI, b2bkingAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoEye, IoPencil, IoMail, IoCheckmarkCircle, IoCloseCircle, IoSend, IoPeople, IoFlash } from 'react-icons/io5';

const TEMPLATE_TYPES = [
  { value: 'order_confirmation', label: 'Order Confirmation' },
  { value: 'order_shipped', label: 'Order Shipped' },
  { value: 'order_delivered', label: 'Order Delivered' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'order_refunded', label: 'Order Refunded' },
  { value: 'order_note', label: 'Order Note' },
  { value: 'new_account', label: 'New Account / Welcome' },
  { value: 'admin_new_account', label: 'Admin — New Customer Signup' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'laybye_application_received', label: 'Laybye Application Received' },
  { value: 'laybye_application_approved', label: 'Laybye Application Approved' },
  { value: 'laybye_application_rejected', label: 'Laybye Application Rejected' },
  { value: 'laybye_created', label: 'Laybye Created' },
  { value: 'laybye_payment', label: 'Laybye Payment Received' },
  { value: 'laybye_completed', label: 'Laybye Completed' },
  { value: 'laybye_reminder', label: 'Laybye Payment Reminder' },
  { value: 'laybye_overdue_reminder', label: 'Laybye Overdue Reminder' },
  { value: 'laybye_expiry_reminder', label: 'Laybye Expiry Reminder' },
  { value: 'loyalty_points_earned', label: 'Loyalty Points Earned' },
  { value: 'loyalty_points_redeemed', label: 'Loyalty Points Redeemed' },
  { value: 'admin_low_stock', label: 'Admin — Low Stock' },
  { value: 'gift_card_issued', label: 'Gift Card Issued' },
  { value: 'coupon_first_purchase', label: 'Coupon - First Purchase' },
  { value: 'coupon_new_user', label: 'Coupon - New User' },
  { value: 'coupon_spending_milestone', label: 'Coupon - Spending Milestone' },
  { value: 'coupon_birthday', label: 'Coupon - Birthday' },
  { value: 'review_reminder', label: 'Review Reminder' },
  { value: 'referral_invite', label: 'Referral — Invite Email' },
  { value: 'promotional', label: 'Promotional' },
  // Service Providers
  { value: 'service_provider_application_received', label: 'SP — Application Received' },
  { value: 'service_provider_approved', label: 'SP — Application Approved' },
  { value: 'service_provider_rejected', label: 'SP — Application Rejected' },
  { value: 'service_provider_subscription_expiring', label: 'SP — Subscription Expiring' },
  { value: 'service_provider_ad_approved', label: 'SP — Ad Approved' },
  // Recurring Orders
  { value: 'recurring_order_created', label: 'Recurring — Order Created' },
  { value: 'recurring_payment_reminder', label: 'Recurring — Payment Reminder' },
  { value: 'recurring_delivery_upcoming', label: 'Recurring — Delivery Upcoming' },
  { value: 'recurring_order_completed', label: 'Recurring — All Delivered' },
  { value: 'recurring_order_cancelled', label: 'Recurring — Cancelled' },
  { value: 'recurring_order_paused', label: 'Recurring — Paused' },
  // Offers
  { value: 'offer_taken', label: 'Offer — Taken Confirmation' },
  { value: 'offer_contact_request_admin', label: 'Offer — Contact Request (Admin)' },
  { value: 'offer_contact_request_customer', label: 'Offer — Contact Request (Customer)' },
  { value: 'offer_subscription_expiring', label: 'Offer — Subscription Expiring' },
  // Campaigns / Demographics
  { value: 'demographic_campaign', label: 'Campaign — General Targeted' },
  { value: 'hobby_campaign', label: 'Campaign — Hobby-Based' },
  { value: 'churn_winback', label: 'Campaign — Churn Win-Back' },
  { value: 'segment_campaign', label: 'Campaign — Segment Targeted' },
  { value: 'custom', label: 'Custom' },
];

// These are auto-injected into every template by sendTemplatedEmail() — always available
const GLOBAL_VARIABLES = ['storeName', 'supportEmail', 'year', 'frontendUrl', 'logoUrl'];

const DEFAULT_VARIABLES = {
  order_confirmation: [
    'customer_name', 'order_number', 'order_date', 'order_total', 'subtotal',
    'shipping_cost', 'discount', 'order_items', 'billing_address', 'shipping_address',
    'delivery_method', 'fulfillment_heading', 'fulfillment_details',
    'pickup_hub_name', 'pickup_hub_address', 'pickup_location',
    'tracking_url', 'order_link',
  ],
  order_shipped: ['customer_name', 'order_number', 'tracking_number', 'tracking_url', 'estimated_delivery'],
  order_delivered: ['customer_name', 'order_number'],
  order_cancelled: ['customer_name', 'order_number', 'cancellation_reason'],
  order_refunded: ['customer_name', 'order_number', 'refund_amount', 'order_total'],
  order_note: ['customer_name', 'order_number', 'note_content'],
  new_account: ['customer_name', 'login_url', 'shop_url'],
  password_reset: ['customer_name', 'reset_url', 'expiry_hours'],
  laybye_application_received: ['customer_name', 'product_name', 'plan_name', 'deposit_amount', 'installment_details'],
  laybye_application_approved: ['customer_name', 'product_name', 'plan_name', 'product_price', 'account_url'],
  laybye_application_rejected: ['customer_name', 'product_name', 'rejection_reason'],
  laybye_created: ['customer_name', 'order_number', 'plan_name', 'deposit_amount', 'installment_amount', 'total_amount', 'payment_link'],
  laybye_payment: ['customer_name', 'order_number', 'payment_amount', 'remaining_balance', 'payment_link'],
  laybye_completed: ['customer_name', 'order_number', 'total_amount'],
  laybye_reminder: ['customer_name', 'order_number', 'payment_amount', 'payment_date', 'remaining_balance', 'message', 'payment_link'],
  laybye_overdue_reminder: ['customer_name', 'order_number', 'payment_amount', 'payment_date', 'days_overdue', 'message', 'payment_link'],
  laybye_expiry_reminder: ['customer_name', 'order_number', 'expiry_date', 'remaining_balance', 'payment_link'],
  loyalty_points_earned: ['customer_name', 'points_earned', 'total_points', 'reason'],
  loyalty_points_redeemed: ['customer_name', 'points_redeemed', 'remaining_points', 'discount_amount'],
  gift_card_issued: ['recipient_name', 'sender_name', 'sender_message', 'gift_card_code', 'gift_card_balance', 'redeem_url'],
  review_reminder: ['customer_name', 'order_number', 'review_url'],
  promotional: ['customer_name', 'promo_title', 'promo_message', 'promo_url'],
  // Service Providers
  service_provider_application_received: ['provider_name', 'business_name', 'category', 'portal_url'],
  service_provider_approved: ['provider_name', 'business_name', 'portal_url', 'approval_notes'],
  service_provider_rejected: ['provider_name', 'business_name', 'rejection_reason'],
  service_provider_subscription_expiring: ['provider_name', 'business_name', 'expiry_date', 'renewal_url'],
  service_provider_ad_approved: ['provider_name', 'business_name', 'ad_title', 'portal_url'],
  // Recurring Orders
  recurring_order_created: ['customer_name', 'product_name', 'quantity', 'frequency', 'payment_mode', 'next_delivery_date', 'account_url'],
  recurring_payment_reminder: ['customer_name', 'product_name', 'next_delivery_date', 'amount_due', 'account_url'],
  recurring_delivery_upcoming: ['customer_name', 'product_name', 'delivery_date', 'quantity', 'account_url'],
  recurring_order_completed: ['customer_name', 'product_name', 'total_deliveries', 'account_url'],
  recurring_order_cancelled: ['customer_name', 'product_name', 'cancellation_reason'],
  recurring_order_paused: ['customer_name', 'product_name', 'account_url'],
  // Offers
  offer_taken: ['customer_name', 'offer_title', 'provider_name', 'account_url'],
  offer_contact_request_admin: ['customer_name', 'customer_email', 'offer_title', 'request_date'],
  offer_contact_request_customer: ['customer_name', 'offer_title', 'provider_name'],
  offer_subscription_expiring: ['customer_name', 'offer_title', 'expiry_date', 'renewal_url'],
  // Campaigns
  demographic_campaign: ['customer_name', 'campaign_title', 'campaign_message', 'cta_url', 'cta_text'],
  hobby_campaign: ['customer_name', 'hobby_name', 'products_html', 'shop_url'],
  churn_winback: ['customer_name', 'days_inactive', 'winback_offer', 'shop_url'],
  segment_campaign: ['customer_name', 'segment_label', 'campaign_message', 'cta_url'],
  custom: [],
};

const EmailTemplatesPage = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [typeFilter, setTypeFilter] = useState('');
  const [editModal, setEditModal] = useState(null); // null | 'new' | template object
  const [previewModal, setPreviewModal] = useState(null);
  const [testEmailModal, setTestEmailModal] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  // Campaign send state
  const [campaignModal, setCampaignModal] = useState(null); // null | template object
  const [campaignAudience, setCampaignAudience] = useState('all'); // 'all' | 'group' | 'manual'
  const [campaignGroupId, setCampaignGroupId] = useState('');
  const [campaignManualEmails, setCampaignManualEmails] = useState('');
  const [campaignSending, setCampaignSending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    slug: '',
    type: 'custom',
    htmlContent: '',
    textContent: '',
    isActive: true,
    isDefault: false,
    fromName: '',
    fromEmail: '',
    replyTo: '',
    previewText: '',
    variables: [],
  });

  const { data, isLoading } = useQuery(
    ['emailTemplates', typeFilter],
    () => emailTemplatesAPI.getAll(typeFilter ? { type: typeFilter } : {}),
    { keepPreviousData: true }
  );

  // Load groups for campaign audience selector
  const { data: groupsData } = useQuery(
    'customer-groups-all',
    () => b2bkingAPI.getCustomerGroups({ limit: 100 }),
    { staleTime: 60000 }
  );
  const customerGroups = groupsData?.data?.data || [];

  // Handle ?group=xxx&groupName=yyy query params from CustomerGroupsPage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const groupId = params.get('group');
    const groupName = params.get('groupName');
    if (groupId) {
      setCampaignAudience('group');
      setCampaignGroupId(groupId);
      // Open a prompt to pick which template to send
      // We'll show the campaign modal with first promotional template selected
      setCampaignModal({ _name: groupName, _preselectedGroup: groupId });
    }
  }, [location.search]);

  const createMutation = useMutation(
    (data) => emailTemplatesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('emailTemplates');
        toast.success('Template created');
        setEditModal(null);
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to create template'),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => emailTemplatesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('emailTemplates');
        toast.success('Template updated');
        setEditModal(null);
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update template'),
    }
  );

  const deleteMutation = useMutation(
    (id) => emailTemplatesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('emailTemplates');
        toast.success('Template deleted');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete template'),
    }
  );

  const previewMutation = useMutation(
    ({ id, sampleData }) => emailTemplatesAPI.preview(id, sampleData),
    {
      onSuccess: (res) => {
        setPreviewModal(res.data?.data || { html: '<p>No preview available</p>' });
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate preview'),
    }
  );

  const templates = data?.data?.data || [];

  const openCreateModal = () => {
    setFormData({
      name: '',
      subject: '',
      slug: '',
      type: 'custom',
      htmlContent: getDefaultHtmlTemplate(),
      textContent: '',
      isActive: true,
      isDefault: false,
      fromName: '',
      fromEmail: '',
      replyTo: '',
      previewText: '',
      variables: [],
    });
    setEditModal('new');
  };

  // Merge saved DB variables with current GLOBAL + DEFAULT vars so newly added
  // variables always appear in the chips even for older saved templates
  const mergeVariables = (type, saved = []) => {
    const savedNames = new Set(saved.map(v => v.name));
    const combined = [...GLOBAL_VARIABLES, ...(DEFAULT_VARIABLES[type] || [])];
    const added = combined.filter(n => !savedNames.has(n)).map(n => ({ name: n, description: '', example: '' }));
    return [...saved, ...added];
  };

  const openEditModal = async (template) => {
    try {
      const res = await emailTemplatesAPI.getOne(template._id);
      const t = res.data?.data || template;
      setFormData({
        name: t.name || '',
        subject: t.subject || '',
        slug: t.slug || '',
        type: t.type || 'custom',
        htmlContent: t.htmlContent || '',
        textContent: t.textContent || '',
        isActive: t.isActive ?? true,
        isDefault: t.isDefault ?? false,
        fromName: t.fromName || '',
        fromEmail: t.fromEmail || '',
        replyTo: t.replyTo || '',
        previewText: t.previewText || '',
        variables: mergeVariables(t.type, t.variables || []),
      });
      setEditModal(t);
    } catch (err) {
      toast.error('Failed to load template');
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.htmlContent) {
      toast.error('Name, subject, and HTML content are required');
      return;
    }

    const payload = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };

    if (editModal === 'new') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: editModal._id, data: payload });
    }
  };

  const handleTypeChange = (newType) => {
    const combined = [...GLOBAL_VARIABLES, ...(DEFAULT_VARIABLES[newType] || [])];
    const vars = combined.map(v => ({ name: v, description: '', example: '' }));
    setFormData({ ...formData, type: newType, variables: vars });
  };

  const getDefaultHtmlTemplate = () => `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #1b5e35; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; color: #333; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; }
    .button { display: inline-block; padding: 12px 30px; background: #1b5e35; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PesaShop</h1>
    </div>
    <div class="content">
      <p>Dear {{customer_name}},</p>
      <p>Your email content goes here.</p>
      <a href="#" class="button">Take Action</a>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PesaShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const getTypeLabel = (type) => TEMPLATE_TYPES.find(t => t.value === type)?.label || type;

  const columns = [
    {
      key: 'name',
      title: 'Template',
      render: (name, row) => (
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-gray-400">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      width: '160px',
      render: (type) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getTypeLabel(type)}
        </span>
      ),
    },
    {
      key: 'subject',
      title: 'Subject',
      render: (subject) => <span className="text-sm text-gray-600">{subject}</span>,
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '80px',
      render: (active) => active
        ? <IoCheckmarkCircle size={20} className="text-green-500" />
        : <IoCloseCircle size={20} className="text-gray-300" />,
    },
    {
      key: 'isDefault',
      title: 'Default',
      width: '80px',
      render: (def) => def ? <span className="badge badge-success text-xs">Default</span> : null,
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '160px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditModal(row)} className="p-2 hover:bg-gray-100 rounded" title="Edit">
            <IoPencil size={16} className="text-primary" />
          </button>
          <button
            onClick={() => previewMutation.mutate({ id: row._id, sampleData: {} })}
            className="p-2 hover:bg-gray-100 rounded"
            title="Preview"
          >
            <IoEye size={16} className="text-blue-500" />
          </button>
          <button
            onClick={() => { setTestEmailModal(row); setTestEmail(''); }}
            className="p-2 hover:bg-gray-100 rounded"
            title="Send Test Email"
          >
            <IoSend size={16} className="text-orange-500" />
          </button>
          <button
            onClick={() => {
              setCampaignModal(row);
              setCampaignAudience('all');
              setCampaignGroupId('');
              setCampaignManualEmails('');
            }}
            className="p-2 hover:bg-gray-100 rounded"
            title="Send Campaign to Customers"
          >
            <IoPeople size={16} className="text-violet-500" />
          </button>
          {!row.isDefault && (
            <button
              onClick={() => {
                if (window.confirm(`Delete template "${row.name}"?`)) {
                  deleteMutation.mutate(row._id);
                }
              }}
              className="p-2 hover:bg-red-50 rounded"
              title="Delete"
            >
              <IoTrash size={14} className="text-red-400" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage transactional and notification email templates</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                const res = await emailTemplatesAPI.seed();
                toast.success(res.data?.message || 'Default templates seeded');
                queryClient.invalidateQueries('emailTemplates');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to seed templates');
              }
            }}
          >
            <IoMail size={18} />
            Seed Defaults
          </Button>
          <Button onClick={openCreateModal}>
            <IoAdd size={20} />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Total Templates</p>
          <p className="text-2xl font-bold text-primary">{templates.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{templates.filter(t => t.isActive).length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Default</p>
          <p className="text-2xl font-bold text-blue-600">{templates.filter(t => t.isDefault).length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Types</p>
          <p className="text-2xl font-bold text-purple-600">{new Set(templates.map(t => t.type)).size}</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            {TEMPLATE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <Table columns={columns} data={templates} loading={isLoading} emptyMessage="No email templates found. Create your first template." />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal === 'new' ? 'Create Email Template' : 'Edit Email Template'}
        size="xl"
        showFooter={true}
        onConfirm={handleSave}
        confirmText={editModal === 'new' ? 'Create Template' : 'Save Changes'}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g. Order Confirmation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="input w-full"
              >
                {TEMPLATE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input w-full"
              placeholder="e.g. Your order #{{order_number}} has been confirmed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preview Text</label>
            <input
              type="text"
              value={formData.previewText}
              onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
              className="input w-full"
              placeholder="Text shown in email client preview"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Name</label>
              <input
                type="text"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                className="input w-full"
                placeholder="PesaShop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Email</label>
              <input
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                className="input w-full"
                placeholder="noreply@pesashop.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reply To</label>
              <input
                type="email"
                value={formData.replyTo}
                onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                className="input w-full"
                placeholder="support@pesashop.com"
              />
            </div>
          </div>

          {/* Available Variables */}
          {formData.variables.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-2">Available Variables</p>
              <div className="flex flex-wrap gap-2">
                {formData.variables.map((v, i) => (
                  <code
                    key={i}
                    className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700 cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${v.name}}}`);
                      toast.success(`Copied {{${v.name}}}`);
                    }}
                    title="Click to copy"
                  >
                    {`{{${v.name}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">HTML Content *</label>
            <textarea
              value={formData.htmlContent}
              onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
              className="input w-full font-mono text-xs"
              rows={16}
              placeholder="<html>...</html>"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Plain Text Content (optional)</label>
            <textarea
              value={formData.textContent}
              onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
              className="input w-full font-mono text-xs"
              rows={4}
              placeholder="Plain text fallback..."
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Set as Default for this type</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title="Email Preview"
        size="lg"
        showFooter={false}
      >
        {previewModal && (
          <div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm"><strong>Subject:</strong> {previewModal.subject}</p>
            </div>
            <div
              className="border border-gray-200 rounded-lg overflow-hidden"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              <iframe
                srcDoc={previewModal.html}
                title="Email Preview"
                className="w-full"
                style={{ minHeight: '400px', border: 'none' }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Test Email Modal */}
      <Modal
        isOpen={!!testEmailModal}
        onClose={() => setTestEmailModal(null)}
        title="Send Test Email"
        onConfirm={async () => {
          if (!testEmail) {
            toast.error('Please enter an email address');
            return;
          }
          try {
            await emailTemplatesAPI.test(testEmailModal._id, testEmail);
            toast.success(`Test email sent to ${testEmail}`);
            setTestEmailModal(null);
          } catch (err) {
            toast.error('Failed to send test email');
          }
        }}
        confirmText="Send Test"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Send a test version of <strong>{testEmailModal?.name}</strong> to:</p>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="input w-full"
            placeholder="your@email.com"
          />
        </div>
      </Modal>

      {/* Campaign Send Modal */}
      <Modal
        isOpen={!!campaignModal}
        onClose={() => setCampaignModal(null)}
        title="Send Email Campaign"
        size="lg"
        showFooter={false}
      >
        {campaignModal && (
          <div className="space-y-5">
            {/* Template info */}
            {campaignModal.name ? (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Template</p>
                <p className="font-medium text-gray-800">{campaignModal.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{campaignModal.subject}</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Select Template *</label>
                <select
                  className="select select-bordered w-full"
                  value={campaignModal._selectedTemplateId || ''}
                  onChange={(e) => setCampaignModal(prev => ({ ...prev, _selectedTemplateId: e.target.value }))}
                >
                  <option value="">— choose a template —</option>
                  {(data?.data?.data || [])
                    .filter(t => t.isActive && ['promotional', 'demographic_campaign', 'hobby_campaign', 'churn_winback', 'segment_campaign', 'custom'].includes(t.type))
                    .map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {/* Audience selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Audience</label>
              <div className="join w-full">
                {[
                  { value: 'all', label: 'All Customers', icon: <IoPeople size={14} /> },
                  { value: 'group', label: 'Customer Group', icon: <IoFlash size={14} /> },
                  { value: 'manual', label: 'Manual List', icon: <IoMail size={14} /> },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn btn-sm join-item flex-1 gap-1 ${campaignAudience === opt.value ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setCampaignAudience(opt.value)}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Group selector */}
            {campaignAudience === 'group' && (
              <div>
                <label className="block text-sm font-medium mb-1">Customer Group *</label>
                <select
                  className="select select-bordered w-full"
                  value={campaignGroupId}
                  onChange={(e) => setCampaignGroupId(e.target.value)}
                >
                  <option value="">— select a group —</option>
                  {customerGroups.map(g => (
                    <option key={g._id} value={g._id}>
                      {g.name} {g.isDynamic ? '⚡' : ''} ({g.customerCount || 0} members)
                    </option>
                  ))}
                </select>
                {campaignGroupId && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <IoPeople size={12} />
                    {customerGroups.find(g => g._id === campaignGroupId)?.customerCount || 0} estimated recipients
                  </p>
                )}
              </div>
            )}

            {/* Manual email list */}
            {campaignAudience === 'manual' && (
              <div>
                <label className="block text-sm font-medium mb-1">Email Addresses</label>
                <textarea
                  className="textarea textarea-bordered w-full text-sm"
                  rows={4}
                  placeholder="one@example.com&#10;two@example.com"
                  value={campaignManualEmails}
                  onChange={(e) => setCampaignManualEmails(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {campaignManualEmails.split(/[\n,;]+/).filter(e => e.trim()).length} addresses
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="alert alert-warning py-2 text-sm">
              <span>
                This will send a live email to {campaignAudience === 'all' ? 'all customers' :
                  campaignAudience === 'group' ? 'the selected customer group' :
                  'the listed email addresses'}. Make sure you have reviewed the template before sending.
              </span>
            </div>

            {/* Send button */}
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setCampaignModal(null)}>Cancel</button>
              <button
                className="btn btn-primary gap-2"
                disabled={campaignSending || (campaignAudience === 'group' && !campaignGroupId)}
                onClick={async () => {
                  const templateId = campaignModal._id || campaignModal._selectedTemplateId;
                  if (!templateId) { toast.error('Please select a template'); return; }

                  setCampaignSending(true);
                  try {
                    await emailTemplatesAPI.sendCampaign(templateId, {
                      audience: campaignAudience,
                      groupId: campaignAudience === 'group' ? campaignGroupId : undefined,
                      emails: campaignAudience === 'manual'
                        ? campaignManualEmails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
                        : undefined,
                    });
                    toast.success('Campaign queued for sending.');
                    setCampaignModal(null);
                  } catch (e) {
                    toast.error(e.response?.data?.message || 'Failed to send campaign');
                  } finally {
                    setCampaignSending(false);
                  }
                }}
              >
                {campaignSending
                  ? <span className="loading loading-spinner loading-sm" />
                  : <IoPeople size={16} />
                }
                Send Campaign
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmailTemplatesPage;
