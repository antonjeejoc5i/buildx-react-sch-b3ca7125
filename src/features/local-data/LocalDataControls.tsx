import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useDemoState } from "../demo-state/useDemoState.ts";
import "./LocalDataControls.css";

function downloadJson(data: string) {
  const url = URL.createObjectURL(
    new Blob([data], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "scheduling-demo-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

export default function LocalDataControls() {
  const { clearData, exportData, importData, isLoading, resetToSeed } =
    useDemoState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const run = async (operation: () => Promise<void>, success: string) => {
    try {
      await operation();
      setMessage(success);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update local data.",
      );
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;
    await run(
      async () => importData(await file.text()),
      "Local data imported successfully.",
    );
  };

  return (
    <section className="local-data" aria-labelledby="local-data-heading">
      <div className="local-data__card">
        <p className="local-data__eyebrow">Demo data controls</p>
        <h2 id="local-data-heading">Manage local data</h2>
        <p>
          Save a copy of this browser&apos;s records, restore a valid copy, or
          return to the deterministic demo dataset.
        </p>
        <div className="local-data__actions">
          <button
            className="local-data__primary"
            disabled={isLoading}
            onClick={() =>
              void run(resetToSeed, "Deterministic seed data restored.")
            }
            type="button"
          >
            Reset to seed data
          </button>
          <button
            disabled={isLoading}
            onClick={() => {
              downloadJson(exportData());
              setMessage("Local data exported as JSON.");
            }}
            type="button"
          >
            Export data
          </button>
          <button
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Import data
          </button>
          <input
            accept="application/json,.json"
            aria-label="Choose local data JSON file"
            className="local-data__input"
            onChange={handleImport}
            ref={inputRef}
            type="file"
          />
          <button
            className="local-data__danger"
            disabled={isLoading}
            onClick={() => setConfirmingClear(true)}
            type="button"
          >
            Clear local data
          </button>
        </div>
        {message !== null && <p aria-live="polite">{message}</p>}
        {confirmingClear && (
          <div
            aria-labelledby="clear-heading"
            className="local-data__confirmation"
            role="alertdialog"
          >
            <h3 id="clear-heading">Clear all local data?</h3>
            <p>This permanently removes every record saved in this browser.</p>
            <button onClick={() => setConfirmingClear(false)} type="button">
              Cancel
            </button>
            <button
              className="local-data__danger"
              onClick={() =>
                void run(async () => {
                  await clearData();
                  setConfirmingClear(false);
                }, "All local demo data was cleared.")
              }
              type="button"
            >
              Confirm clear data
            </button>
          </div>
        )}
      </div>
      <aside
        className="local-data__notice"
        aria-label="Local simulation notice"
      >
        <h2>Local simulation notice</h2>
        <p>
          Data, permissions, audit history, notifications, integrations, and
          concurrency are local simulations in this browser-only demo. They do
          not connect to live systems or enforce production access controls.
        </p>
      </aside>
    </section>
  );
}
