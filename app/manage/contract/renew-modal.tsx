'use client';

import { request } from '@/utils/request';
import RenewModal from '@/components/contract/RenewModal';
import type { ContractItem } from './page';

type Props = {
  contract: ContractItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ManageRenewModal({ contract, onClose, onSuccess }: Props) {
  return (
    <RenewModal
      contract={contract}
      onClose={onClose}
      onSuccess={onSuccess}
      onRenew={(id, renewMonths) =>
        request(`/manage/contract/${id}/renew`, { method: 'POST', json: { renewMonths } })
      }
    />
  );
}
