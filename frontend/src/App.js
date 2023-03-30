import "./App.css";
import { MainLayout } from "./MainLayout";
import MainPage from "./MainPage";

function App() {
  return (
    <div className="App">
      <MainLayout>
        <MainPage />
      </MainLayout>
    </div>
  );
}

export default App;
