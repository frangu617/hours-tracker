
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ClockPage from "./pages/ClockPage";
import ViewHoursPage from "./pages/ViewHoursPage";

function App() {
  return (
    <>
      <h1>Work Time Tracker</h1>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/clock" element={<ClockPage />} />
          <Route path="/view-hours" element={<ViewHoursPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
