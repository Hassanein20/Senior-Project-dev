import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Registration from "./Pages/Registration";
import GettingInfo from "./Pages/GettingInfo";
import Home from "./Pages/Home";
import User from "./Pages/User";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeProvider } from "./Components/ThemeContext";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <div>
          <Routes>
            <Route path='/Home' element={<Home />} />
            <Route path='/SignUp' element={<Registration />} />
            <Route path='/SignUp/GettingInfo' element={<GettingInfo />} />
            <Route path='/User' element={<User />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
