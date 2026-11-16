export function learnerLoginEmail(value) {
  const login = String(value || '').trim()
  return login.includes('@') ? login : login.toLowerCase() + '@learners.nileanalytics.invalid'
}
