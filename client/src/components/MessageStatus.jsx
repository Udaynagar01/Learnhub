import { Check, CheckCheck } from 'lucide-react';

/** WhatsApp-style ticks: sent → delivered → read (seen). */
export default function MessageStatus({ status }) {
  const s = status || 'sent';
  const isRead = s === 'read';
  const isDelivered = s === 'delivered' || isRead;

  return (
    <span
      className={`ml-1 inline-flex items-center ${isRead ? 'text-sky-300' : 'text-white/70'}`}
      title={isRead ? 'Seen' : isDelivered ? 'Delivered' : 'Sent'}
    >
      {isDelivered ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
    </span>
  );
}
