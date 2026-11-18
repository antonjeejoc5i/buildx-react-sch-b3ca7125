import DemoStateProvider from "./features/demo-state/DemoStateProvider.tsx";
import LocalDataControls from "./features/local-data/LocalDataControls.tsx";
import WelcomeScreen from "./features/welcome/WelcomeScreen.tsx";

export default function App() {
  return (
    <DemoStateProvider>
      <WelcomeScreen />
      <LocalDataControls />
    </DemoStateProvider>
  );
}
