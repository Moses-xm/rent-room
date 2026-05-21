// 将通知内容里的 {{t:ISO}} 标记替换为浏览器本地时区格式化时间
export function renderNotificationContent(content: string): string {
  return content.replace(/\{\{t:([^}]+)\}\}/g, (_, iso) => fmtDateTime(iso));
}

export function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function fmtDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day} ${h}:${min}`;
}
