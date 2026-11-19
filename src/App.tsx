import AppShell from "./features/app-shell/AppShell.tsx";
import DemoStateProvider from "./features/demo-state/DemoStateProvider.tsx";
import ParticipantPresentationPanel from "./features/participant-presentation/ParticipantPresentationPanel.tsx";

export default function App() {
  return (
    <DemoStateProvider>
      <AppShell />
      <ParticipantPresentationPanel />
    </DemoStateProvider>
  );
}
