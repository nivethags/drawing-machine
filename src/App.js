import { BrowserRouter, Routes, Route } from "react-router-dom";

import BackNeckSelection from "./components/blouse/BackNeckSelection";
import FrontNeckSelection from "./components/blouse/FrontNeckSelection";
import SleeveSelection from "./components/blouse/SleeveSelection";
import MeasurementPage from "./components/blouse/MeasurementPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<BackNeckSelection />}
        />

        <Route
          path="/blouse/back-neck"
          element={<BackNeckSelection />}
        />

        <Route
          path="/blouse/front-neck"
          element={<FrontNeckSelection />}
        />
        <Route path="/sleeve-selection" element={<SleeveSelection />} />
        <Route
          path="/measurements"
          element={<MeasurementPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;