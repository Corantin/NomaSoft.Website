export function authorized(authorization: string | null) {
  return [
    ['corantin', process.env.CRM_CORANTIN_PASSWORD],
    ['kafan', process.env.CRM_KAFAN_PASSWORD],
  ].some(
    ([user, password]) =>
      password && authorization === 'Basic ' + btoa(user + ':' + password),
  );
}
