import React from "react";

type Props = {
  open: boolean;
  submitting: boolean;
  amountDraft: string;
  setAmountDraft: (v: string) => void;
  nameDraft: string;
  setNameDraft: (v: string) => void;
  ibanDraft: string;
  setIbanDraft: (v: string) => void;
  balance: number;
  onClose: () => void;
  onConfirm: () => void;
};

export default function WithdrawModal({
  open,
  submitting,
  amountDraft,
  setAmountDraft,
  nameDraft,
  setNameDraft,
  ibanDraft,
  setIbanDraft,
  balance,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 modal-fade">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0014] p-6">
        <div className="text-lg font-semibold mb-2">
          Вывод на банковские реквизиты
        </div>
        <div className="text-white/70 text-sm mb-4">
          Данные конфиденциальны и не сохраняются (демо).
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-white/70">Сумма (SOL)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountDraft}
              onChange={(e) => {
                const raw = e.target.value.replace(",", ".");
                if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                  setAmountDraft(raw);
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
              }}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
            />
            <div className="text-xs text-white/50 mt-1">
              Доступно: {balance.toFixed(2)} SOL
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70">
              Получатель (ФИО/Компания)
            </label>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-white/70">IBAN/Счёт</label>
            <input
              value={ibanDraft}
              onChange={(e) => setIbanDraft(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 p-3 outline-none"
            />
            {ibanDraft && (
              <div className="text-xs text-white/50 mt-1">
                Будет отправлено на: {ibanDraft.slice(0, 4)}****
                {ibanDraft.slice(-4)}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold disabled:opacity-60"
          >
            {submitting ? "Проверяем…" : "Подтвердить вывод"}
          </button>
        </div>
        <div className="text-xs text-white/50 mt-2">
          После подтверждения: "Заявка принята. Поступит в течение 2 рабочих
          дней"
        </div>
      </div>
    </div>
  );
}
