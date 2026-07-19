export function getAuthRedirectPath(user) {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'instructor') return '/instructor';
  return '/dashboard';
}
