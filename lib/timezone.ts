const taipeiFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Taipei',
  calendar: 'gregory',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** Serialize Taipei local time for the RSVP sheet as YYYY-MM-DD HH:mm:ss. */
export function getTimeInTaipei(now = new Date()): string {
  const { year, month, day, hour, minute, second } = Object.fromEntries(
    taipeiFormatter.formatToParts(now).map(({ type, value }) => [type, value])
  );
  return `${year.padStart(4, '0')}-${month}-${day} ${hour}:${minute}:${second}`;
}
