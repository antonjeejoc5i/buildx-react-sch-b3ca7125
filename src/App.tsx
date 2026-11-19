import { useEffect, useState } from "react";
import AppShell from "./features/app-shell/AppShell.tsx";
import DemoModeBadge from "./features/app-shell/DemoModeBadge.tsx";
import DecipherHandoffRoute from "./features/decipher-handoff/DecipherHandoffRoute.tsx";
import DemoStateProvider from "./features/demo-state/DemoStateProvider.tsx";
import "./App.css";

/** A participant arriving from a Decipher handoff link sees only their booking page, not the staff app. */
function isHandoffHash(hash: string) {
  return /^#?\/?handoff\//.test(hash);
}

/** The participant-facing frame: no staff navigation, but the demo disclosure stays visible. */
function ParticipantFrame() {
  return (
    <div className="participant-frame">
      <header className="participant-frame__header">
        <span className="participant-frame__brand">Study scheduling</span>
        <DemoModeBadge />
        <a className="participant-frame__exit" href="#/">
          Back to staff demo
        </a>
      </header>
      <DecipherHandoffRoute />
    </div>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <DemoStateProvider>
      {isHandoffHash(hash) ? <ParticipantFrame /> : <AppShell />}
    </DemoStateProvider>
  );
}
