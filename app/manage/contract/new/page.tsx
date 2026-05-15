'use client';

import ContractForm from '../contract-form';

export default function NewContractPage() {
  return (
    <ContractForm
      title="新建合同"
      subtitle="为租客和房源创建租赁合同，创建后将立即扣款并生效。"
      backHref="/manage/contract"
    />
  );
}
