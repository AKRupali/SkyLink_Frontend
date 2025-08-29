import React from 'react';
import Login from './Login';
import './Login.css';
import CustomerOverview from './Cust_overview';
import AdminOverview from './Admin_overview';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Protected route with debugging
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  console.log('ProtectedRoute Debug:', {
    token: token ? 'Present' : 'Missing',
    userRole: userRole || 'Not set',
    requiredRole: requiredRole || 'Any role'
  });
  
  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Role mismatch: User has "${userRole}", required "${requiredRole}"`);
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('Access granted');
  return children;
};

// Enhanced Unauthorized component with more info
const Unauthorized = () => {
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Unauthorized Access</h2>
      <p>Logged in as: {userEmail || 'Unknown'}</p>
      <p>Your role: {userRole || 'Not assigned'}</p>
      <p>You don't have permission to access this page.</p>
      <button onClick={() => {
        // Try to redirect to appropriate dashboard based on role
        if (userRole === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }}>
        Go to My Dashboard
      </button>
      <button onClick={() => {
        localStorage.clear();
        window.location.href = '/login';
      }} style={{ marginLeft: '10px', backgroundColor: '#ff6b6b' }}>
        Logout
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRole="CUSTOMER">
              <CustomerOverview />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminOverview />
            </ProtectedRoute>
          } 
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </Router>
  );
}

export default App;

// import React from 'react';
// import Login from './Login';
// import './Login.css';
// import CustomerOverview from './Cust_overview';
// import AdminOverview from './Admin_overview';
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// // Protected route component with role-based access
// const ProtectedRoute = ({ children, requiredRole }) => {
//   const token = localStorage.getItem('token');
//   const userRole = localStorage.getItem('userRole');
  
//   if (!token) {
//     return <Navigate to="/login" replace />;
//   }
  
//   if (requiredRole && userRole !== requiredRole) {
//     return <Navigate to="/unauthorized" replace />;
//   }
  
//   return children;
// };

// // Unauthorized access component
// const Unauthorized = () => {
//   return (
//     <div style={{ padding: '20px', textAlign: 'center' }}>
//       <h2>Unauthorized Access</h2>
//       <p>You don't have permission to access this page.</p>
//       <button onClick={() => window.location.href = '/dashboard'}>
//         Go to Dashboard
//       </button>
//     </div>
//   );
// };

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Redirect root path to Login */}
//         <Route path="/" element={<Navigate to="/login" replace />} />
        
//         {/* Login route */}
//         <Route path="/login" element={<Login />} />
        
//         {/* Customer Dashboard route - Protected for CUSTOMER role */}
//         <Route 
//           path="/dashboard" 
//           element={
//             <ProtectedRoute requiredRole="CUSTOMER">
//               <CustomerOverview />
//             </ProtectedRoute>
//           } 
//         />
        
//         {/* Admin Dashboard route - Protected for ADMIN role */}
//         <Route 
//           path="/admin" 
//           element={
//             <ProtectedRoute requiredRole="ADMIN">
//               <AdminOverview />
//             </ProtectedRoute>
//           } 
//         />
        
//         {/* Unauthorized access route */}
//         <Route path="/unauthorized" element={<Unauthorized />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;