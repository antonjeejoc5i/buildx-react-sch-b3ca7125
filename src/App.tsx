import AppShell from "./features/app-shell/AppShell.tsx";
import DecipherHandoffRoute from "./features/decipher-handoff/DecipherHandoffRoute.tsx";
import DemoStateProvider from "./features/demo-state/DemoStateProvider.tsx";
import NotificationOutbox from "./features/notification-outbox/NotificationOutbox.tsx";
import ParticipantPresentationPanel from "./features/participant-presentation/ParticipantPresentationPanel.tsx";

export default function App() {
  return (
    <DemoStateProvider>
      <AppShell />
      <NotificationOutbox />
      <DecipherHandoffRoute />
      <ParticipantPresentationPanel />
    </DemoStateProvider>
  );
}
