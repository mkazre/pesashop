import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { pageTemplatesAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import { History, RotateCcw, Eye, X } from 'lucide-react';

const VersionHistory = ({ pageId, onClose, onRestore }) => {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data: versionsResponse, isLoading } = useQuery(
    ['page-versions', pageId],
    () => pageTemplatesAPI.getVersions(pageId),
    {
      enabled: !!pageId,
    }
  );

  const versions = versionsResponse?.data?.data || [];

  const restoreMutation = useMutation(
    (versionId) => pageTemplatesAPI.restoreVersion(pageId, versionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['page-template', pageId]);
        queryClient.invalidateQueries(['page-versions', pageId]);
        queryClient.invalidateQueries('page-templates');
        toast.success('Version restored successfully');
        if (onRestore) onRestore();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to restore version');
      },
    }
  );

  const handleRestore = (version) => {
    if (window.confirm(`Are you sure you want to restore version ${version.version}? This will replace the current page content.`)) {
      restoreMutation.mutate(version._id);
      if (onClose) onClose();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Modal isOpen onClose={onClose} title="Version History" size="large">
      <div className="max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">Loading versions...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History size={48} className="mx-auto mb-4 opacity-50" />
            <p>No version history available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version._id}
                className={`p-4 border rounded-lg ${
                  selectedVersion?._id === version._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        Version {version.version}
                      </span>
                      {version.savedBy && (
                        <span className="text-sm text-gray-500">
                          by {version.savedBy.name || version.savedBy.email}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(version.savedAt)}
                    </p>
                    {version.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        {version.notes}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {Object.keys(version.components || {}).length} components
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedVersion(version)}
                      className="p-2 hover:bg-gray-100 rounded text-gray-600"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleRestore(version)}
                      className="p-2 hover:bg-blue-100 rounded text-blue-600"
                      title="Restore this version"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedVersion && (
        <VersionPreview
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}
    </Modal>
  );
};

// Version Preview Component
const VersionPreview = ({ version, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Version {version.version} Preview
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(version.savedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow p-6">
            <pre className="text-xs overflow-auto max-h-[600px]">
              {JSON.stringify(version.components, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
