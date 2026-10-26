interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, busy }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow">
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="min-h-11 rounded-md border border-slate-300 px-4">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="min-h-11 rounded-md bg-red-600 px-4 text-white disabled:opacity-60"
          >
            {busy ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
