import { useEffect, useState } from "react";
import AppShell from "./features/app-shell/AppShell.tsx";
import DecipherHandoffRoute from "./features/decipher-handoff/DecipherHandoffRoute.tsx";
import DemoStateProvider from "./features/demo-state/DemoStateProvider.tsx";
import NotificationOutbox from "./features/notification-outbox/NotificationOutbox.tsx";
import ParticipantPresentationPanel from "./features/participant-presentation/ParticipantPresentationPanel.tsx";

/** A participant arriving from a Decipher handoff link sees only their booking page, not the staff app. */
function isHandoffHash(hash: string) {
  return /^#?\/?handoff\//.test(hash);
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
      {isHandoffHash(hash) ? null : <AppShell />}
      <NotificationOutbox />
      <DecipherHandoffRoute />
      <ParticipantPresentationPanel />
    </DemoStateProvider>
  );
}
