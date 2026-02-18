import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { codeSnippetsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from 'react-hot-toast';
import { IoShield, IoAlertCircle, IoCheckmark, IoClose } from 'react-icons/io5';

/**
 * Emergency Disable Page
 * Accessible even if the site is broken due to bad code snippets
 * URL: /emergency-disable?token=YOUR_EMERGENCY_TOKEN
 */
const EmergencyDisablePage = () => {
  const [token, setToken] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get emergency token from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token') || '';

  const { data, isLoading, refetch } = useQuery(
    ['code-snippets-emergency', urlToken],
    () => codeSnippetsAPI.getAll({}),
    {
      enabled: !!urlToken,
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  const emergencyDisableMutation = useMutation(
    ({ id, token }) => codeSnippetsAPI.emergencyDisable(id, token),
    {
      onSuccess: () => {
        toast.success('Snippet emergency disabled');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to disable snippet');
      }
    }
  );

  const snippets = data?.data?.data || [];
  const filteredSnippets = snippets.filter(snippet => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      snippet.name.toLowerCase().includes(search) ||
      snippet.description?.toLowerCase().includes(search) ||
      snippet.code.toLowerCase().includes(search)
    );
  });

  const activeSnippets = filteredSnippets.filter(s => s.isActive && !s.emergencyDisable);
  const problematicSnippets = filteredSnippets.filter(s => s.syntaxValid === false);

  if (!urlToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-4">
            <IoShield className="text-red-500 mx-auto" size={64} />
            <h1 className="text-2xl font-bold text-red-600">Emergency Disable</h1>
            <p className="text-gray-600">
              Enter your emergency token to access this page.
            </p>
            <Input
              type="password"
              placeholder="Emergency Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              fullWidth
            />
            <Button
              onClick={() => {
                if (token) {
                  window.location.href = `/emergency-disable?token=${token}`;
                } else {
                  toast.error('Please enter a token');
                }
              }}
              fullWidth
            >
              Access Emergency Disable
            </Button>
            <p className="text-xs text-gray-500">
              This page allows you to disable code snippets even if your site is broken.
              Set EMERGENCY_TOKEN in your backend .env file.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
              <IoShield size={32} />
              Emergency Disable
            </h1>
            <p className="text-gray-600 mt-2">
              Disable code snippets that may be causing site issues
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <IoAlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-red-800">Emergency Mode Active</h3>
              <p className="text-sm text-red-700 mt-1">
                Use this page to disable problematic code snippets. Changes take effect immediately.
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <p className="text-sm text-gray-600">Total Snippets</p>
            <p className="text-2xl font-bold text-primary">{snippets.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Active Snippets</p>
            <p className="text-2xl font-bold text-yellow-600">{activeSnippets.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Syntax Errors</p>
            <p className="text-2xl font-bold text-red-600">{problematicSnippets.length}</p>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <Input
            placeholder="Search snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </Card>

        {/* Snippets List */}
        <Card>
          <h2 className="text-xl font-bold mb-4">All Snippets</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredSnippets.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No snippets found</p>
          ) : (
            <div className="space-y-4">
              {filteredSnippets.map(snippet => (
                <div
                  key={snippet._id}
                  className={`p-4 border rounded-lg ${
                    snippet.emergencyDisable
                      ? 'bg-gray-100 border-gray-300'
                      : snippet.syntaxValid === false
                      ? 'bg-red-50 border-red-200'
                      : snippet.isActive
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{snippet.name}</h3>
                        {snippet.emergencyDisable && (
                          <span className="badge badge-error">Emergency Disabled</span>
                        )}
                        {snippet.syntaxValid === false && (
                          <span className="badge badge-warning">Syntax Errors</span>
                        )}
                        {snippet.isActive && !snippet.emergencyDisable && (
                          <span className="badge badge-success">Active</span>
                        )}
                      </div>
                      {snippet.description && (
                        <p className="text-sm text-gray-600 mb-2">{snippet.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Type: {snippet.type}</span>
                        <span>Environment: {snippet.environment}</span>
                        <span>Location: {snippet.location}</span>
                      </div>
                      {snippet.syntaxErrors && snippet.syntaxErrors.length > 0 && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                          <p className="font-semibold text-red-800">Errors:</p>
                          <ul className="list-disc list-inside text-red-700">
                            {snippet.syntaxErrors.slice(0, 3).map((error, idx) => (
                              <li key={idx}>
                                {error.message} (Line {error.line})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {!snippet.emergencyDisable && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Emergency disable "${snippet.name}"?`)) {
                            emergencyDisableMutation.mutate({
                              id: snippet._id,
                              token: urlToken
                            });
                          }
                        }}
                        loading={emergencyDisableMutation.isLoading}
                      >
                        <IoShield size={16} className="mr-1" />
                        Emergency Disable
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmergencyDisablePage;
