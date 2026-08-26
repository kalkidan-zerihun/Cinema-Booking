import React, { useState } from 'react';
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
      <div className="flex items-center justify-between pb-2">
        <label className="text-sm font-bold text-gray-200">Select Payment Method</label>
        <span className="text-xs text-gray-400">All transactions encrypted</span>
      </div>

      {/* Grid of Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Telebirr */}
        <button
          type="button"
          id="payment-method-telebirr"
          onClick={() => onChangeMethod('TELEBIRR')}
          className={`flex items-center space-x-3 p-4 rounded-xl border text-left transition-all ${
            selectedMethod === 'TELEBIRR'
              ? 'bg-amber-950/30 border-amber-500/80 text-white ring-1 ring-amber-500/40 shadow-lg'
              : 'bg-[#141520] border-[#252838] text-gray-400 hover:text-gray-200 hover:border-gray-600'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">Telebirr</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300">
                FAST
              </span>
            </div>
            <span className="text-xs text-gray-400 block">Mobile wallet direct charge</span>
          </div>
        </button>

        {/* Chapa */}
        <button
          type="button"
          id="payment-method-chapa"
          onClick={() => onChangeMethod('CHAPA')}
          className={`flex items-center space-x-3 p-4 rounded-xl border text-left transition-all ${
            selectedMethod === 'CHAPA'
              ? 'bg-emerald-950/30 border-emerald-500/80 text-white ring-1 ring-emerald-500/40 shadow-lg'
              : 'bg-[#141520] border-[#252838] text-gray-400 hover:text-gray-200 hover:border-gray-600'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">Chapa</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300">
                ET GATEWAY
              </span>
            </div>
            <span className="text-xs text-gray-400 block">Local banks & cards</span>
          </div>
        </button>

        {/* Card */}
        <button
          type="button"
          id="payment-method-card"
          onClick={() => onChangeMethod('CARD')}
          className={`flex items-center space-x-3 p-4 rounded-xl border text-left transition-all ${
            selectedMethod === 'CARD'
              ? 'bg-blue-950/30 border-blue-500/80 text-white ring-1 ring-blue-500/40 shadow-lg'
              : 'bg-[#141520] border-[#252838] text-gray-400 hover:text-gray-200 hover:border-gray-600'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block">Credit / Debit Card</span>
            <span className="text-xs text-gray-400 block">Visa, Mastercard, CBE Birr</span>
          </div>
        </button>

        {/* Pay at Cinema */}
        <button
          type="button"
          id="payment-method-cinema"
          onClick={() => onChangeMethod('PAY_AT_CINEMA')}
          className={`flex items-center space-x-3 p-4 rounded-xl border text-left transition-all ${
            selectedMethod === 'PAY_AT_CINEMA'
              ? 'bg-red-950/30 border-red-500/80 text-white ring-1 ring-red-500/40 shadow-lg'
              : 'bg-[#141520] border-[#252838] text-gray-400 hover:text-gray-200 hover:border-gray-600'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block">Pay at Cinema</span>
            <span className="text-xs text-gray-400 block">Pay at box office counter</span>
          </div>
        </button>
      </div>

      {/* Dynamic input fields based on selected payment method */}
      <div className="p-4 rounded-xl bg-[#10111a] border border-[#202232] space-y-3">
        {selectedMethod === 'TELEBIRR' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">
              Telebirr Registered Phone Number (+251...)
            </label>
            <input
              type="tel"
              id="telebirr-phone-input"
              value={phone}
              onChange={(e) => onChangePhone(e.target.value)}
              placeholder="0911234567 or +251911234567"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#161824] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-gray-400">
              A USSD confirmation prompt or OTP authorization request will be linked to this number.
            </p>
          </div>
        )}

        {selectedMethod === 'CHAPA' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
              <Zap className="w-4 h-4" />
              <span>Chapa Instant Payment Gateway</span>
            </div>
            <p className="text-xs text-gray-300">
              Seamlessly integrates with Ethiopian commercial banks (Awash, CBE, Dashen, Abyssinia, etc.).
            </p>
            <input
              type="email"
              id="chapa-email-input"
              placeholder="Customer email for Chapa digital receipt"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#161824] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {selectedMethod === 'CARD' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Card Number
              </label>
              <input
                type="text"
                id="card-number-input"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => onChangeCardNumber(e.target.value)}
                placeholder="4111 2222 3333 4444"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#161824] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Expiry (MM/YY)
                </label>
                <input
                  type="text"
                  id="card-expiry-input"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => onChangeCardExpiry(e.target.value)}
                  placeholder="08/28"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#161824] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  CVV / CVC
                </label>
                <input
                  type="password"
                  id="card-cvc-input"
                  maxLength={4}
                  value={cardCvc}
                  onChange={(e) => onChangeCardCvc(e.target.value)}
                  placeholder="123"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#161824] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'PAY_AT_CINEMA' && (
          <div className="flex items-start space-x-2 text-xs text-amber-300/90 bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Reservation Policy:</span> Your seats will be held under your booking code. Please present your digital ticket and complete payment at the counter at least 20 minutes prior to showtime.
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 text-xs text-gray-400 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Official PCI-DSS compliant cinema transaction system.</span>
      </div>
    </div>
  );
};
