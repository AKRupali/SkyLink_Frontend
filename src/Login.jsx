import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store authentication data - check the actual response structure
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role || data.user?.role); // Check different possible response formats
        localStorage.setItem('userEmail', data.email || data.user?.email || loginData.email);
        localStorage.setItem('userId', data.userId || data.id || data.user?.id);
        
        console.log('Login response:', data); // Debugging
        
        alert('Login successful!');
        
        // Redirect based on ACTUAL role from backend
        const userRole = data.role || data.user?.role;
        if (userRole === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setErrorMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Cannot connect to server. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    if (signupData.password !== signupData.confirmPassword) {
      setErrorMessage("Passwords don't match");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8081/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          mobileNumber: signupData.mobileNumber,
          password: signupData.password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Account created successfully! Please login.');
        setActiveTab('login');
        setLoginData(prev => ({ ...prev, email: signupData.email }));
        setSignupData({
          name: '',
          email: '',
          mobileNumber: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setErrorMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage('Cannot connect to server. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            disabled={isLoading}
          >
            Login
          </button>
          <button 
            className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
            disabled={isLoading}
          >
            Sign Up
          </button>
        </div>
        
        <div className="form-container">
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          
          {activeTab === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input
                  type="text"
                  id="signup-name"
                  name="name"
                  value={signupData.name}
                  onChange={handleSignupChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="signup-mobile">Mobile Number</label>
                <input
                  type="tel"
                  id="signup-mobile"
                  name="mobileNumber"
                  value={signupData.mobileNumber}
                  onChange={handleSignupChange}
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit mobile number"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  type="password"
                  id="signup-password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="signup-confirm-password"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

// import React, { useState } from 'react';
// import './Login.css';

// const Login = () => {
//   const [activeTab, setActiveTab] = useState('login');
//   const [loginData, setLoginData] = useState({
//     email: '',
//     password: '',
//     role: 'CUSTOMER' // Default role
//   });
//   const [signupData, setSignupData] = useState({
//     name: '',
//     email: '',
//     mobileNumber: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [errorMessage, setErrorMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const handleLoginChange = (e) => {
//     const { name, value } = e.target;
//     setLoginData(prev => ({ ...prev, [name]: value }));
//     setErrorMessage('');
//   };

//   const handleSignupChange = (e) => {
//     const { name, value } = e.target;
//     setSignupData(prev => ({ ...prev, [name]: value }));
//     setErrorMessage('');
//   };

//   const handleLoginSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMessage('');
    
//     try {
//       const response = await fetch('http://localhost:8081/api/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email: loginData.email,
//           password: loginData.password,
//           role: loginData.role
//         }),
//       });
      
//       // Check if response is OK
//       if (response.ok) {
//         const data = await response.json();
        
//         // Store authentication data
//         localStorage.setItem('token', data.token);
//         localStorage.setItem('userRole', data.role || loginData.role);
//         localStorage.setItem('userEmail', data.email || loginData.email);
//         localStorage.setItem('userId', data.userId || data.id);
        
//         alert('Login successful!');
        
//         // Redirect based on role
//         if (data.role === 'ADMIN' || loginData.role === 'ADMIN') {
//           window.location.href = '/admin';
//         } else {
//           window.location.href = '/dashboard';
//         }
//       } else {
//         const errorData = await response.json();
//         setErrorMessage(errorData.message || 'Login failed. Please check your credentials.');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       setErrorMessage('Cannot connect to server. Please make sure the backend is running.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSignupSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMessage('');
    
//     if (signupData.password !== signupData.confirmPassword) {
//       setErrorMessage("Passwords don't match");
//       setIsLoading(false);
//       return;
//     }
    
//     try {
//       const response = await fetch('http://localhost:8081/api/auth/signup', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           name: signupData.name,
//           email: signupData.email,
//           mobileNumber: signupData.mobileNumber,
//           password: signupData.password,
//           role: 'CUSTOMER' // Default role for signup
//         }),
//       });
      
//       if (response.ok) {
//         alert('Account created successfully! Please login.');
//         setActiveTab('login');
//         // Pre-fill login email
//         setLoginData(prev => ({ ...prev, email: signupData.email }));
//         // Clear signup form
//         setSignupData({
//           name: '',
//           email: '',
//           mobileNumber: '',
//           password: '',
//           confirmPassword: ''
//         });
//       } else {
//         const errorData = await response.json();
//         setErrorMessage(errorData.message || 'Signup failed. Please try again.');
//       }
//     } catch (error) {
//       console.error('Signup error:', error);
//       setErrorMessage('Cannot connect to server. Please make sure the backend is running.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <div className="tabs">
//           <button 
//             className={`tab ${activeTab === 'login' ? 'active' : ''}`}
//             onClick={() => setActiveTab('login')}
//             disabled={isLoading}
//           >
//             Login
//           </button>
//           <button 
//             className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
//             onClick={() => setActiveTab('signup')}
//             disabled={isLoading}
//           >
//             Sign Up
//           </button>
//         </div>
        
//         <div className="form-container">
//           {errorMessage && (
//             <div className="error-message">
//               {errorMessage}
//             </div>
//           )}
          
//           {activeTab === 'login' ? (
//             <form className="auth-form" onSubmit={handleLoginSubmit}>
//               <div className="form-group">
//                 <label htmlFor="login-email">Email</label>
//                 <input
//                   type="email"
//                   id="login-email"
//                   name="email"
//                   value={loginData.email}
//                   onChange={handleLoginChange}
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label htmlFor="login-role">Role</label>
//                 <select
//                   id="login-role"
//                   name="role"
//                   value={loginData.role}
//                   onChange={handleLoginChange}
//                   required
//                   disabled={isLoading}
//                 >
//                   <option value="CUSTOMER">Customer</option>
//                   <option value="ADMIN">Admin</option>
//                 </select>
//               </div>
              
//               <div className="form-group">
//                 <label htmlFor="login-password">Password</label>
//                 <input
//                   type="password"
//                   id="login-password"
//                   name="password"
//                   value={loginData.password}
//                   onChange={handleLoginChange}
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
              
//               <button 
//                 type="submit" 
//                 className="submit-btn"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'Logging in...' : 'Login'}
//               </button>
//             </form>
//           ) : (
//             <form className="auth-form" onSubmit={handleSignupSubmit}>
//               <div className="form-group">
//                 <label htmlFor="signup-name">Full Name</label>
//                 <input
//                   type="text"
//                   id="signup-name"
//                   name="name"
//                   value={signupData.name}
//                   onChange={handleSignupChange}
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label htmlFor="signup-email">Email</label>
//                 <input
//                   type="email"
//                   id="signup-email"
//                   name="email"
//                   value={signupData.email}
//                   onChange={handleSignupChange}
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label htmlFor="signup-mobile">Mobile Number</label>
//                 <input
//                   type="tel"
//                   id="signup-mobile"
//                   name="mobileNumber"
//                   value={signupData.mobileNumber}
//                   onChange={handleSignupChange}
//                   pattern="[0-9]{10}"
//                   title="Please enter a 10-digit mobile number"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label htmlFor="signup-password">Password</label>
//                 <input
//                   type="password"
//                   id="signup-password"
//                   name="password"
//                   value={signupData.password}
//                   onChange={handleSignupChange}
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label htmlFor="signup-confirm-password">Confirm Password</label>
//                 <input
//                   type="password"
//                   id="signup-confirm-password"
//                   name="confirmPassword"
//                   value={signupData.confirmPassword}
//                   onChange={handleSignupChange}
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
              
//               <button 
//                 type="submit" 
//                 className="submit-btn"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'Creating Account...' : 'Create Account'}
//               </button>
//             </form>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login; 


