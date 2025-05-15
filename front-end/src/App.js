import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import SignIn from "./Pages/SignIn";
import GettingInfo from "./Pages/GettingInfo";
import Home from "./Pages/Home";
import User from "./Pages/User";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeProvider } from "./Components/ThemeContext";
import { AuthProvider, useAuth } from "./Context/AuthContext";

//Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to='/SignIn' />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div>
            <Routes>
              <Route path='/Home' element={<Home />} />
              <Route path='/SignIn' element={<SignIn />} />
              <Route path='/SignUp/GettingInfo' element={<GettingInfo />} />
              <Route
                path='/User'
                element={
                  <ProtectedRoute>
                    <User />
                  </ProtectedRoute>
                }
              />
              <Route path='/' element={<Navigate to='/Home' />} />
            </Routes>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
