export function normalizePhone(value: unknown): string {
  let phone = String(value ?? '').trim().replace(/[\s()\-]/g, '')
  if (phone.startsWith('00218')) phone = `+218${phone.slice(5)}`
  else if (phone.startsWith('218')) phone = `+${phone}`
  else if (phone.startsWith('0') && phone.length >= 9) phone = `+218${phone.slice(1)}`
  return phone
}
