import { useEffect, useState, type FormEvent } from 'react';
import { useStrings } from '../i18n';
import { useAdmin } from '../admin';
import type { PaymentSettings } from '../types';
import { fetchPayment, savePayment } from '../api';
import {
  DRAW_DATE,
  PAYMENT_DEADLINE,
  VIPPS_AMOUNT,
  VIPPS_APP_LINK,
  VIPPS_NUMBER,
  VIPPS_WEB_LINK,
} from '../config/payment';
import { IMG } from '../images';

// A coarse pointer means a touch device, i.e. one that can hand over to the
// installed Vipps app; everything else is sent to the website instead.
function vippsHref(): string {
  const isTouch =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  return isTouch ? VIPPS_APP_LINK : VIPPS_WEB_LINK;
}

// Left page — a simple payment instruction, centred on the page.
// The instruction box is one big link: tapping it anywhere opens the Vipps app.
// In ADMIN mode the amount, the Vipps number and the two dates in the hint can
// be edited below the box; until they are set, the placeholders from
// config/payment.ts are shown.
export function PaymentPage() {
  const t = useStrings();
  const { isAdmin, password } = useAdmin();
  const [settings, setSettings] = useState<PaymentSettings>({
    amount: null,
    phone: null,
    deadline: null,
    drawDate: null,
  });
  const [amountInput, setAmountInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [drawDateInput, setDrawDateInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    fetchPayment().then((loaded) => {
      setSettings(loaded);
      setAmountInput(loaded.amount === null ? '' : String(loaded.amount));
      setPhoneInput(loaded.phone ?? '');
      setDeadlineInput(loaded.deadline ?? '');
      setDrawDateInput(loaded.drawDate ?? '');
    });
  }, []);

  const amountText = settings.amount === null ? VIPPS_AMOUNT : t.payment.amount(settings.amount);
  const phoneText = settings.phone ?? VIPPS_NUMBER;
  const deadlineText = settings.deadline ?? PAYMENT_DEADLINE;
  const drawDateText = settings.drawDate ?? DRAW_DATE;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!password || status === 'saving') return;
    setStatus('saving');
    const trimmed = amountInput.trim();
    const saved = await savePayment(
      {
        amount: trimmed === '' ? null : Number(trimmed),
        phone: phoneInput.trim() || null,
        deadline: deadlineInput.trim() || null,
        drawDate: drawDateInput.trim() || null,
      },
      password,
    );
    if (saved) {
      setSettings(saved);
      setStatus('saved');
    } else {
      setStatus('failed');
    }
  }

  return (
    <section className="page payment-page">
      <h1>{t.payment.heading}</h1>
      {/* The whole box is the link — tapping anywhere in it opens Vipps. */}
      <a
        className="payment-instruction"
        href={vippsHref()}
        rel="noreferrer"
        title={t.payment.openVipps}
      >
        <img className="vipps-icon" src={IMG.vipps} alt="" />
        <span>{t.payment.instruction(amountText, phoneText)}</span>
      </a>
      <div className="payment-hint-row">
        <img className="payment-mascot" src={IMG.happyWine} alt="" />
        <p className="payment-hint">{t.payment.hint(deadlineText, drawDateText)}</p>
      </div>

      {isAdmin && (
        <form className="payment-admin" onSubmit={handleSave}>
          <h2 className="payment-admin-heading">{t.payment.editHeading}</h2>
          <div className="payment-admin-row">
            <input
              className="payment-admin-input"
              type="number"
              min="0"
              inputMode="numeric"
              value={amountInput}
              placeholder={t.payment.fieldAmount}
              aria-label={t.payment.fieldAmount}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setStatus('idle');
              }}
            />
            <input
              className="payment-admin-input"
              type="tel"
              value={phoneInput}
              placeholder={t.payment.fieldPhone}
              aria-label={t.payment.fieldPhone}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setStatus('idle');
              }}
            />
            <input
              className="payment-admin-input"
              type="text"
              value={deadlineInput}
              placeholder={t.payment.fieldDeadline}
              aria-label={t.payment.fieldDeadline}
              onChange={(e) => {
                setDeadlineInput(e.target.value);
                setStatus('idle');
              }}
            />
            <input
              className="payment-admin-input"
              type="text"
              value={drawDateInput}
              placeholder={t.payment.fieldDrawDate}
              aria-label={t.payment.fieldDrawDate}
              onChange={(e) => {
                setDrawDateInput(e.target.value);
                setStatus('idle');
              }}
            />
            <button type="submit" className="payment-admin-save" disabled={status === 'saving'}>
              {status === 'saving' ? t.payment.saving : t.payment.saveSettings}
            </button>
          </div>
          {status === 'saved' && <p className="payment-admin-note">{t.payment.saved}</p>}
          {status === 'failed' && <p className="payment-admin-error">{t.payment.saveFailed}</p>}
        </form>
      )}
    </section>
  );
}
