import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Tag, Shield, Lock, Landmark, Smartphone, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Button from '../components/Button';
import GlassCard from '../components/ui/GlassCard';
import {
  getPaymentMethodLabel,
  validateCheckout,
} from '../utils/checkoutValidation';
import { showCheckoutValidationError, showPaymentSuccessBill } from '../utils/paymentSuccess';

const BANKS = [
  { code: 'HDFC', label: 'HDFC Bank' },
  { code: 'ICIC', label: 'ICICI Bank' },
  { code: 'SBIN', label: 'State Bank of India' },
  { code: 'AXIS', label: 'Axis Bank' },
  { code: 'KKBK', label: 'Kotak Mahindra Bank' },
  { code: 'YESB', label: 'YES Bank' },
  { code: 'PUNB', label: 'Punjab National Bank' },
  { code: 'IDFB', label: 'IDFC First Bank' },
];

function buildBill({
  orderId,
  paymentId,
  billing,
  subMethod,
  bankCode,
  upiVpa,
  cart,
  orderCourses,
  subtotal,
  discount,
  total,
}) {
  const items = (orderCourses || cart).map((item) => ({
    title: item.title,
    price: item.price || 0,
  }));

  return {
    orderId,
    paymentId,
    dateLabel: new Date().toLocaleString('en-IN'),
    billing,
    methodLabel:
      subMethod === 'upi'
        ? `UPI · ${upiVpa.trim()}`
        : getPaymentMethodLabel(subMethod, bankCode, BANKS),
    items,
    subtotal,
    discount,
    total,
  };
}

export default function Checkout() {
  const { cart, clearCart, user } = useAuth();
  const [method, setMethod] = useState('razorpay');
  const [subMethod, setSubMethod] = useState('upi');
  const [upiVpa, setUpiVpa] = useState('');
  const [bankCode, setBankCode] = useState('HDFC');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [billing, setBilling] = useState({ name: '', phone: '', address: '' });
  const [banner, setBanner] = useState(null);
  const navigate = useNavigate();

  const subtotal = cart.reduce((s, c) => s + (c.price || 0), 0);
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = () => {
    setBanner(null);
    if (coupon.toUpperCase() === 'LEARN10') setDiscount(Math.round(subtotal * 0.1));
    else if (coupon.toUpperCase() === 'SAVE50') setDiscount(50);
    else setBanner({ type: 'error', title: 'Invalid coupon', message: 'Try LEARN10 or SAVE50' });
  };

  const finishSuccess = async (bill) => {
    clearCart();
    await showPaymentSuccessBill(bill);
    navigate('/dashboard/learning');
  };

  const handlePay = async () => {
    if (!user) return navigate('/login');
    if (cart.length === 0) return;

    const errors = validateCheckout({
      billing: {
        name: billing.name || user?.name,
        phone: billing.phone,
        address: billing.address,
      },
      subMethod,
      upiVpa,
      bankCode,
      card,
    });

    if (errors.length) {
      await showCheckoutValidationError(errors);
      return;
    }

    const billingDetails = {
      name: (billing.name || user?.name || '').trim(),
      phone: billing.phone.trim(),
      address: billing.address.trim(),
    };

    setBanner({ type: 'info', title: 'Starting payment…', message: 'Opening secure payment window' });
    setLoading(true);

    try {
      const { data } = await api.post('/orders/checkout', {
        courseIds: cart.map((c) => c._id),
        couponCode: coupon || undefined,
      });
      const { orderId, amount, keyId, dbOrderId, devMode, order } = data.data;

      if (devMode) {
        const bill = buildBill({
          orderId: dbOrderId,
          paymentId: 'DEV-PAYMENT',
          billing: billingDetails,
          subMethod,
          bankCode,
          upiVpa,
          cart,
          orderCourses: order?.courseIds,
          subtotal,
          discount,
          total,
        });
        setBanner(null);
        await finishSuccess(bill);
        return;
      }

      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        await new Promise((res) => {
          script.onload = res;
        });
      }

      const options = {
        key: keyId,
        amount: (amount || total) * 100,
        currency: 'INR',
        name: 'LearnHub',
        description: 'Course Purchase',
        order_id: orderId,
        prefill: {
          name: billingDetails.name,
          contact: billingDetails.phone,
          email: user.email,
          vpa: subMethod === 'upi' ? upiVpa.trim() : undefined,
        },
        method: {
          upi: subMethod === 'upi',
          netbanking: subMethod === 'netbanking',
          card: subMethod === 'card',
        },
        bank: subMethod === 'netbanking' ? bankCode : undefined,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: dbOrderId,
            });

            const bill = buildBill({
              orderId: dbOrderId,
              paymentId: response.razorpay_payment_id,
              billing: billingDetails,
              subMethod,
              bankCode,
              upiVpa,
              cart,
              orderCourses: verifyRes.data.data?.order?.courseIds,
              subtotal,
              discount,
              total,
            });

            setBanner(null);
            await finishSuccess(bill);
          } catch (err) {
            setBanner({
              type: 'error',
              title: 'Payment verification failed',
              message: err.response?.data?.message || 'Try again or contact support.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setBanner({ type: 'error', title: 'Payment cancelled', message: 'You closed the payment window.' });
            setLoading(false);
          },
        },
        notes: {
          payment_preference: subMethod,
          bank: subMethod === 'netbanking' ? bankCode : '',
          billing_address: billingDetails.address,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setBanner({
          type: 'error',
          title: 'Payment failed',
          message: response.error?.description || 'Payment could not be completed.',
        });
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      setBanner({
        type: 'error',
        title: 'Payment failed',
        message: err.response?.data?.message || 'Checkout failed. Use test keys or enroll free courses.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-slate-500">Your cart is empty.</p>
        <Button className="mt-4" onClick={() => navigate('/courses')}>
          Browse Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Checkout</span>
      </nav>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-title mt-4"
      >
        Checkout
      </motion.h1>

      {banner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 rounded-2xl border p-4 ${
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
              : banner.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
                : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {banner.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
            ) : banner.type === 'error' ? (
              <AlertTriangle className="mt-0.5 h-5 w-5" />
            ) : (
              <Lock className="mt-0.5 h-5 w-5" />
            )}
            <div className="min-w-0">
              <p className="font-semibold">{banner.title}</p>
              {banner.message && <p className="mt-1 text-sm opacity-90">{banner.message}</p>}
            </div>
            <button
              type="button"
              className="ml-auto rounded-xl px-2 py-1 text-sm opacity-70 hover:opacity-100"
              onClick={() => setBanner(null)}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <GlassCard className="p-6">
            <h2 className="font-semibold text-slate-900">Billing Details</h2>
            <p className="mt-1 text-xs text-slate-500">All fields are required before payment.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name *</label>
                <input
                  className="input-field mt-1"
                  value={billing.name}
                  onChange={(e) => setBilling({ ...billing, name: e.target.value })}
                  placeholder={user?.name}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone *</label>
                <input
                  className="input-field mt-1"
                  value={billing.phone}
                  onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Address *</label>
                <input
                  className="input-field mt-1"
                  value={billing.address}
                  onChange={(e) => setBilling({ ...billing, address: e.target.value })}
                  placeholder="House no, street, city, state, PIN"
                  required
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <CreditCard className="h-5 w-5 text-primary-500" />
              Payment Method
            </h2>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
              <input type="radio" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
              <div>
                <p className="font-medium">Razorpay</p>
                <p className="text-sm text-slate-500">UPI, Cards, Net Banking, Wallets</p>
              </div>
            </label>
            {method === 'razorpay' && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSubMethod('upi')}
                  className={`card-hover flex items-center gap-2 px-4 py-3 text-left ${
                    subMethod === 'upi' ? 'ring-2 ring-primary-500/30' : ''
                  }`}
                >
                  <Smartphone className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="font-semibold">UPI</p>
                    <p className="text-xs text-slate-500">Google Pay / PhonePe</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSubMethod('netbanking')}
                  className={`card-hover flex items-center gap-2 px-4 py-3 text-left ${
                    subMethod === 'netbanking' ? 'ring-2 ring-primary-500/30' : ''
                  }`}
                >
                  <Landmark className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="font-semibold">Netbanking</p>
                    <p className="text-xs text-slate-500">Choose your bank</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSubMethod('card')}
                  className={`card-hover flex items-center gap-2 px-4 py-3 text-left ${
                    subMethod === 'card' ? 'ring-2 ring-primary-500/30' : ''
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="font-semibold">Card</p>
                    <p className="text-xs text-slate-500">Debit / Credit</p>
                  </div>
                </button>
              </div>
            )}

            {method === 'razorpay' && subMethod === 'upi' && (
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">UPI ID *</label>
                <input
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="yourname@oksbi"
                  className="input-field mt-1"
                  required
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Payment will not proceed until a valid UPI ID is entered.
                </p>
              </div>
            )}

            {method === 'razorpay' && subMethod === 'netbanking' && (
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Select bank *</label>
                <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="input-field mt-1" required>
                  {BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {method === 'razorpay' && subMethod === 'card' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Name on card *</label>
                  <input
                    className="input-field mt-1"
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                    placeholder="As printed on card"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Card number *</label>
                  <input
                    className="input-field mt-1"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Expiry *</label>
                  <input
                    className="input-field mt-1"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">CVV *</label>
                  <input
                    className="input-field mt-1"
                    type="password"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    placeholder="123"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>
            )}

            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Lock className="h-3 w-3" /> Secured by Razorpay · 256-bit encryption
            </p>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="sticky top-24 p-6">
            <h2 className="font-semibold text-slate-900">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {cart.map((c) => (
                <div key={c._id} className="flex justify-between text-sm">
                  <span className="line-clamp-1 pr-2 text-slate-600">{c.title}</span>
                  <span className="shrink-0 font-medium">₹{c.price}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field pl-10"
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
              </div>
              <Button variant="outline" type="button" onClick={applyCoupon}>
                Apply
              </Button>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <Button className="mt-6 w-full" size="lg" onClick={handlePay} disabled={loading}>
              {loading ? 'Processing...' : `Pay ₹${total}`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-400">
              <Shield className="h-3 w-3" /> 30-day money-back guarantee
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
