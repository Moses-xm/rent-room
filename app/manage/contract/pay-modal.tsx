'use client';

import { request } from '@/utils/request';
import PayModal from '@/components/contract/PayModal';
import type { ContractItem } from './page';

type Props = {
  contract: ContractItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ManagePayModal({ contract, onClose, onSuccess }: Props) {
  return (
    <PayModal
      contract={contract}
      onClose={onClose}
      onSuccess={onSuccess}
      onPay={(id, payCode) =>
        request(`/manage/contract/${id}/pay`, { method: 'POST', json: { payCode } })
      }
    />
  );
}
