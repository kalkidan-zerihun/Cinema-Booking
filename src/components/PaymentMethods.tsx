import React from 'react';
import { Smartphone, CreditCard, Store, ShieldCheck, Zap, Info } from 'lucide-react';
import { PaymentMethod } from '../types';

interface PaymentMethodsProps {
  selectedMethod: PaymentMethod;
  onChangeMethod: (method: PaymentMethod) => void;
  phone: string;
  onChangePhone: (val: string) => void;
  cardNumber: string;
  onChangeCardNumber: (val: string) => void;
  cardExpiry: string;
  onChangeCardExpiry: (val: string) => void;
  cardCvc: string;
  onChangeCardCvc: (val: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  selectedMethod,
  onChangeMethod,
  phone,
  onChangePhone,
  cardNumber,
  onChangeCardNumber,
  cardExpiry,
  onChangeCardExpiry,
  cardCvc,
  onChangeCardCvc,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <label className="text-xs sm:text-sm font-bold text-white">Payment Method</label>
        <span className="text-[11px] text-slate-400">256-bit Encrypted</span>
      </div>

      {/* Grid of Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Telebirr */}
        <button
          type="button"
          id="payment-method-telebirr"
          onClick={() => onChangeMethod('TELEBIRR')}
          className={`flex items-center space-x-3 p-3.5 rounded-2xl border text-left transition-all ${
            selectedMethod === 'TELEBIRR'
              ? 'bg-amber-400/10 border-amber-400 text-white shadow-md'
              : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-white">Telebirr</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-400">
                FAST
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Mobile wallet direct charge</span>
          </div>
        </button>

        {/* Chapa */}
        <button
          type="button"
          id="payment-method-chapa"
          onClick={() => onChangeMethod('CHAPA')}
          className={`flex items-center space-x-3 p-3.5 rounded-2xl border text-left transition-all ${
            selectedMethod === 'CHAPA'
              ? 'bg-amber-400/10 border-amber-400 text-white shadow-md'
              : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-white">Chapa</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                GATEWAY
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Local banks & CBE Birr</span>
          </div>
        </button>

        {/* Card */}
        <button
          type="button"
          id="payment-method-card"
          onClick={() => onChangeMethod('CARD')}
          className={`flex items-center space-x-3 p-3.5 rounded-2xl border text-left transition-all ${
            selectedMethod === 'CARD'
              ? 'bg-amber-400/10 border-amber-400 text-white shadow-md'
              : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-white">Visa / Mastercard</span>
            </div>
            <span className="text-[11px] text-slate-400 block">International credit/debit card</span>
          </div>
        </button>

        {/* Pay at Counter */}
        <button
          type="button"
          id="payment-method-counter"
          onClick={() => onChangeMethod('PAY_AT_CINEMA')}
          className={`flex items-center space-x-3 p-3.5 rounded-2xl border text-left transition-all ${
            selectedMethod === 'PAY_AT_CINEMA'
              ? 'bg-amber-400/10 border-amber-400 text-white shadow-md'
              : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-white">Pay at Counter</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Cash or POS at cinema desk</span>
          </div>
        </button>
      </div>

      {/* Dynamic input form depending on selected method */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        {selectedMethod === 'TELEBIRR' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Telebirr Mobile Number</label>
            <input
              type="tel"
              id="telebirr-phone-input"
              value={phone}
              onChange={(e) => onChangePhone(e.target.value)}
              placeholder="0911234567"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              A push notification will prompt you on your device to authorize the transaction.
            </p>
          </div>
        )}

        {selectedMethod === 'CHAPA' && (
          <div className="space-y-1.5 text-xs text-slate-300">
            <p className="font-semibold text-white">Chapa Hosted Checkout</p>
            <p className="text-slate-400">
              You will be redirected to Chapa's official gateway to pay securely using Commercial Bank of Ethiopia (CBE), Awash, Telebirr, or Abyssinia.
            </p>
          </div>
        )}

        {selectedMethod === 'CARD' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Card Number</label>
              <input
                type="text"
                id="card-number-input"
                value={cardNumber}
                onChange={(e) => onChangeCardNumber(e.target.value)}
                placeholder="4111 •••• •••• ••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date</label>
                <input
                  type="text"
                  id="card-expiry-input"
                  value={cardExpiry}
                  onChange={(e) => onChangeCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">CVC / CVV</label>
                <input
                  type="password"
                  id="card-cvc-input"
                  value={cardCvc}
                  onChange={(e) => onChangeCardCvc(e.target.value)}
                  placeholder="•••"
                  maxLength={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'PAY_AT_CINEMA' && (
          <div className="space-y-1.5 text-xs text-slate-300">
            <p className="font-semibold text-white">Box Office Hold Notice</p>
            <p className="text-slate-400">
              Your seats are held. Please present your booking reference code at the cinema ticketing counter at least 30 minutes before showtime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
