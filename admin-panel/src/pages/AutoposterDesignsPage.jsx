import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { autoposterAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoAdd, IoCreate, IoTrash } from 'react-icons/io5';

export default function AutoposterDesignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery('autoposter-designs', () => autoposterAPI.listDesigns());
  const designs = data?.data?.data || [];

  const deleteMutation = useMutation((id) => autoposterAPI.deleteDesign(id), {
    onSuccess: () => { toast.success('Design deleted'); queryClient.invalidateQueries('autoposter-designs'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visual Post Designer</h1>
          <p className="text-gray-500 mt-1">Saved designs and starter templates (Spec 7.5–7.6).</p>
        </div>
        <Button onClick={() => navigate('/autoposter/designer')}><IoAdd size={20} className="mr-2" />New Design</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? <p>Loading…</p> : designs.map((d) => (
          <Card key={d._id}>
            <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden flex items-center justify-center">
              {d.thumbnailUrl ? <img src={d.thumbnailUrl} alt={d.title} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">No preview yet</span>}
            </div>
            <h3 className="font-semibold text-sm truncate">{d.title}</h3>
            <p className="text-xs text-gray-400 mb-2">{d.templateFlag ? 'Template' : d.canvasPreset}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => navigate(`/autoposter/designer?id=${d._id}`)}><IoCreate size={16} className="mr-1" />Open</Button>
              {!d.templateFlag && (
                <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(d._id)}><IoTrash size={16} /></Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
