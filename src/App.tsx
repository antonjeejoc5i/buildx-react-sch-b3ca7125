import DemoStateProvider from "./features/demo-state/DemoStateProvider.tsx";
import AppShell from "./features/app-shell/AppShell.tsx";

export default function App() {
  return (
    <DemoStateProvider>
      <AppShell />
    </DemoStateProvider>
  );
}
