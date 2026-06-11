/**
 * Get current time in Taiwan timezone (Asia/Taipei)
 * Format: YYYY-MM-DD HH:mm:ss
 */
export function getTimeInTaipei(): string {
  const now = new Date();

  const taipeiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));

  const year = taipeiTime.getFullYear();
  const month = String(taipeiTime.getMonth() + 1).padStart(2, '0');
  const date = String(taipeiTime.getDate()).padStart(2, '0');
  const hours = String(taipeiTime.getHours()).padStart(2, '0');
  const minutes = String(taipeiTime.getMinutes()).padStart(2, '0');
  const seconds = String(taipeiTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}
