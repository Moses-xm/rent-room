import { RoomImage } from "@/components/portal/RoomImage";

interface InfoItem {
  label: string;
  value: string;
}

interface BrokerCardProps {
  name: string;
  avatarUrl?: string;
  info?: InfoItem[];
  onAppointment?: () => void;
  onContact?: () => void;
}

export function BrokerCard({
  name,
  avatarUrl,
  info = [],
  onAppointment,
  onContact,
}: BrokerCardProps) {
  return (
    <div className="border border-border p-5">
      {/* 头像 */}
      <div className="w-32.5 h-35.25 mx-auto overflow-hidden rounded-sm">
        <RoomImage src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* 姓名 */}
      <div className="text-center text-[15px] py-4 text-text">{name}</div>

      {/* 信息行 */}
      {info.length > 0 && (
        <div className="space-y-0.5 mb-4">
          {info.map((item, i) => (
            <div key={i} className="text-xs text-text-2 leading-[26px] truncate">
              <span className="text-text-muted">{item.label}：</span>
              {item.value}
            </div>
          ))}
        </div>
      )}

      {/* 按钮 */}
      <div className="space-y-2.5">
        <button
          onClick={onAppointment}
          className="w-full h-10 text-[15px] text-center border border-primary text-primary hover:bg-primary hover:text-white cursor-pointer transition-colors disabled:cursor-not-allowed"
        >
          预约看房
        </button>
        <button
          onClick={onContact}
          className="w-full h-10 text-[15px] text-center border border-primary text-primary hover:bg-primary hover:text-white cursor-pointer transition-colors disabled:cursor-not-allowed"
        >
          联系房东
        </button>
      </div>
    </div>
  );
}
