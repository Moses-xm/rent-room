'use client';

import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import ContractForm from '../../contract-form';
import type { ContractItem } from '../../page';

export default function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<ContractItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<{ success: boolean; data: ContractItem }>(`/manage/contract/${id}`)
      .then((res) => {
        if (res.success) setContract(res.data);
        else toast.error('合同加载失败');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 skeleton-shimmer rounded-sm" />
          <div className="w-40 h-7 skeleton-shimmer rounded" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-20 h-4 skeleton-shimmer rounded" />
                <div className="w-full h-11 skeleton-shimmer rounded-xl" />
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-full h-64 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <ContractForm
      title="编辑合同"
      subtitle={
        contract.status === 2
          ? '合同已完成，内容不可修改。'
          : '进行中的合同仅允许修改开始租房时间，结束时间和期限将自动重新计算。'
      }
      backHref={`/manage/contract/${id}`}
      isEdit
      editingContract={contract}
    />
  );
}
