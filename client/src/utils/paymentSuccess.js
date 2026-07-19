import Swal from 'sweetalert2';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBillHtml(bill) {
  const items = (bill.items || [])
    .map(
      (item) => `
        <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px">
          <span style="color:#334155;text-align:left">${escapeHtml(item.title)}</span>
          <strong style="color:#0f172a;white-space:nowrap">₹${item.price || 0}</strong>
        </div>`
    )
    .join('');

  return `
    <div style="text-align:left;font-family:Arial,sans-serif;color:#0f172a">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px">
        <p style="margin:0 0 8px;font-size:13px;color:#64748b">Order ID</p>
        <p style="margin:0;font-weight:700;word-break:break-all">${escapeHtml(bill.orderId || '—')}</p>
        ${
          bill.paymentId
            ? `<p style="margin:12px 0 8px;font-size:13px;color:#64748b">Payment ID</p>
               <p style="margin:0;font-weight:700;word-break:break-all">${escapeHtml(bill.paymentId)}</p>`
            : ''
        }
        <p style="margin:12px 0 8px;font-size:13px;color:#64748b">Date</p>
        <p style="margin:0;font-weight:600">${escapeHtml(bill.dateLabel)}</p>
      </div>

      <p style="margin:0 0 8px;font-size:14px;font-weight:700">Bill To</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155">${escapeHtml(bill.billing?.name || '')}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#64748b">${escapeHtml(bill.billing?.phone || '')}</p>
      <p style="margin:0 0 16px;font-size:14px;color:#64748b">${escapeHtml(bill.billing?.address || '')}</p>

      <p style="margin:0 0 8px;font-size:14px;font-weight:700">Payment Method</p>
      <p style="margin:0 0 16px;font-size:14px;color:#334155">${escapeHtml(bill.methodLabel)}</p>

      <p style="margin:0 0 8px;font-size:14px;font-weight:700">Courses</p>
      ${items}

      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #cbd5e1;font-size:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="color:#64748b">Subtotal</span>
          <span>₹${bill.subtotal || 0}</span>
        </div>
        ${
          bill.discount > 0
            ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#059669">
                 <span>Discount</span>
                 <span>-₹${bill.discount}</span>
               </div>`
            : ''
        }
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-top:8px">
          <span>Total Paid</span>
          <span style="color:#4f46e5">₹${bill.total || 0}</span>
        </div>
      </div>
    </div>
  `;
}

export async function showPaymentSuccessBill(bill) {
  return Swal.fire({
    icon: 'success',
    title: 'Payment Successful!',
    html: formatBillHtml(bill),
    confirmButtonText: 'Go to My Learning',
    confirmButtonColor: '#6366f1',
    allowOutsideClick: false,
    width: 560,
  });
}

export function showCheckoutValidationError(errors = []) {
  return Swal.fire({
    icon: 'warning',
    title: 'Complete your details',
    html: errors.map((error) => `• ${escapeHtml(error)}`).join('<br>'),
    confirmButtonText: 'OK',
    confirmButtonColor: '#6366f1',
  });
}
