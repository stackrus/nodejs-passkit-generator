import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import { MainLayout } from "./MainLayout";
import MainPage from "./MainPage";

function App() {
  return (
    <div className="App">
      <ToastContainer />
      <MainLayout>
        <MainPage />
      </MainLayout>
    </div>
  );
}

export default App;
