import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { publicRoutes, protectedRoutes } from './routes/routes';
import { reset, resetWords } from './store/gameSlice';
import './App.css';

function RouteResetHandler() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    // Reset both games when route changes
    dispatch(reset());
    dispatch(resetWords());
  }, [location.pathname, dispatch]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/memcoach">
        <RouteResetHandler />
        <MainLayout>
          <Routes>
            {publicRoutes.map((route) => (
              <Route 
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
            
            {protectedRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute>
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;