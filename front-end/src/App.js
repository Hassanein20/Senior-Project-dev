import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Registration from "./Pages/Registration";
import GettingInfo from "./Pages/GettingInfo";
import Home from "./Pages/Home";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/Home' element={<Home />} />
        <Route path='/SignUp' element={<Registration />} />
        <Route path='/SignUp/GettingInfo' element={<GettingInfo />} />
      </Routes>
    </Router>
  );
}

export default App;
