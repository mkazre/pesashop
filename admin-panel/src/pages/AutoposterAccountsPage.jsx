import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { autoposterAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import {
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoTiktok,
  IoWarningOutline,
  IoRefreshOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5';

// Platform (not just account) is defined here, not fetched from the backend —
// these five are fixed by the spec (Section 3) and don't change at runtime.
const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', Icon: IoLogoFacebook, color: '#1877F2' },
  { key: 'instagram', label: 'Instagram', Icon: IoLogoInstagram, color: '#E4405F' },
  { key: 'x', label: 'X (Twitter)', Icon: IoLogoTwitter, color: '#000000' },
  { key: 'linkedin', label: 'LinkedIn', Icon: IoLogoLinkedin, color: '#0A66C2' },
  { key: 'tiktok', label: 'TikTok', Icon: IoLogoTiktok, color: '#000000' },
];

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-yellow-100 text-yellow-700',
  revoked: 'bg-gray-100 text-gray-600',
  needs_reauth: 'bg-red-100 text-red-700',
};

export default function AutoposterAccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('autoposter-accounts', () => autoposterAPI.listAccounts());
  const accounts = data?.data?.data || [];

  // The OAuth callback (Spec Section 5.1) redirects the browser back here with
  // ?connected=<platform> or ?error=<message> — surface that as a toast once,
  // then strip the query params so a refresh doesn't re-fire it.
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      toast.success(`${connected} connected successfully`);
      queryClient.invalidateQueries('autoposter-accounts');
    }
    if (error) {
      toast.error(`Connection failed: ${error.replace(/_/g, ' ')}`);
    }
    if (connected || error) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectMutation = useMutation(
    (platform) => autoposterAPI.oauthStart(platform),
    {
      onSuccess: (res) => {
        window.location.href = res.data.url; // hand off to the platform's own login/consent screen
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Could not start connection');
      },
    }
  );

  const disconnectMutation = useMutation(
    (id) => autoposterAPI.disconnectAccount(id),
    {
      onSuccess: () => {
        toast.success('Account disconnected');
        queryClient.invalidateQueries('autoposter-accounts');
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to disconnect'),
    }
  );

  const refreshMutation = useMutation(
    (id) => autoposterAPI.refreshAccount(id),
    {
      onSuccess: () => {
        toast.success('Token refreshed');
        queryClient.invalidateQueries('autoposter-accounts');
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Refresh failed'),
    }
  );

  const needsReauthCount = accounts.filter(a => a.status === 'needs_reauth').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Auto-Poster — Connected Accounts</h1>
        <p className="text-gray-500 mt-1">Connect at least one account per platform to enable posting.</p>
      </div>

      {needsReauthCount > 0 && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          <IoWarningOutline size={20} />
          <span>
            {needsReauthCount} account{needsReauthCount > 1 ? 's need' : ' needs'} re-authentication — scheduled posts
            targeting {needsReauthCount > 1 ? 'them are' : 'it is'} paused until reconnected.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map(({ key, label, Icon, color }) => {
          const platformAccounts = accounts.filter(a => a.platform === key);
          return (
            <Card key={key}>
              <div className="flex items-center gap-3 mb-4">
                <Icon size={28} color={color} />
                <h3 className="text-lg font-semibold">{label}</h3>
              </div>

              {isLoading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : platformAccounts.length === 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={connectMutation.isLoading && connectMutation.variables === key}
                  onClick={() => connectMutation.mutate(key)}
                >
                  Connect {label}
                </Button>
              ) : (
                <div className="space-y-3">
                  {platformAccounts.map(account => (
                    <div key={account._id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{account.displayName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[account.status] || ''}`}>
                          {account.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={refreshMutation.isLoading && refreshMutation.variables === account._id}
                          onClick={() => refreshMutation.mutate(account._id)}
                        >
                          <IoRefreshOutline size={16} className="mr-1" />
                          Refresh
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={disconnectMutation.isLoading && disconnectMutation.variables === account._id}
                          onClick={() => {
                            if (window.confirm(`Disconnect ${account.displayName}? Scheduled posts targeting it will be paused.`)) {
                              disconnectMutation.mutate(account._id);
                            }
                          }}
                        >
                          <IoCloseCircleOutline size={16} className="mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    loading={connectMutation.isLoading && connectMutation.variables === key}
                    onClick={() => connectMutation.mutate(key)}
                  >
                    + Connect another {label} account
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
