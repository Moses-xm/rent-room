type Props = {
  type: number;
  fee: number | null;
  pledge: number | null;
  /** block 模式：主金额和副行分两行显示（桌面端列/详情页）；默认 false 为行内 */
  block?: boolean;
  amountClassName?: string;
  subClassName?: string;
};

export default function OrderAmountDisplay({
  type,
  fee,
  pledge,
  block = false,
  amountClassName = '',
  subClassName = '',
}: Props) {
  const hasPledge = pledge != null && pledge > 0;

  if (type === 3) {
    return (
      <>
        <span className={`font-medium ${subClassName}`}>退押金 </span>
        <span className={`font-medium ${amountClassName}`}>¥{(pledge ?? 0).toFixed(2)}</span>
      </>
    );
  }

  const total = (fee ?? 0) + (pledge ?? 0);

  if (block) {
    return (
      <>
        <p className={amountClassName}>¥{total.toFixed(2)}</p>
        {hasPledge && (
          <p className={`mt-0.5 ${subClassName}`}>含押金 ¥{pledge!.toFixed(2)}</p>
        )}
      </>
    );
  }

  return (
    <>
      <span className={amountClassName}>¥{total.toFixed(2)}</span>
      {hasPledge && (
        <span className={`ml-2 ${subClassName}`}>含押金 ¥{pledge!.toFixed(2)}</span>
      )}
    </>
  );
}
