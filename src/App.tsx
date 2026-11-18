import DemoStateProvider from "./features/demo-state/DemoStateProvider.tsx";
import WelcomeScreen from "./features/welcome/WelcomeScreen.tsx";

export default function App() {
  return (
    <DemoStateProvider>
      <WelcomeScreen />
    </DemoStateProvider>
  );
}
