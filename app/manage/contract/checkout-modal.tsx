'use client';

import { request } from '@/utils/request';
import CheckoutModal from '@/components/contract/CheckoutModal';
import type { ContractItem } from './page';

type Props = {
  contract: ContractItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ManageCheckoutModal({ contract, onClose, onSuccess }: Props) {
  return (
    <CheckoutModal
      contract={contract}
      onClose={onClose}
      onSuccess={onSuccess}
      onCheckout={(id) =>
        request(`/manage/contract/${id}/checkout`, { method: 'POST', json: {} })
      }
    />
  );
}
