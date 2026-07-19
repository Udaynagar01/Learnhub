export function AuthFieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function authInputClass(error) {
  return `input-field mt-1${error ? ' border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`;
}
