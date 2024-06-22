import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App'; // Adjust the import path as necessary
import './AllPages.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [isSigningUp, setIsSigningUp] = useState(false); // To toggle between login and signup form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('supplier'); // Default role; adjust based on your requirements
  const [name, setName] = useState(''); // State to store farm name for suppliers

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const { data } = await axios.post('/api/users/login', { email, password });
    login(data.userDetails); // Ensure userDetails includes the 'name' attribute
  } catch (error) {
    alert(error.message);
  }
};

const handleSignup = async (e) => {
  e.preventDefault();
  try {
    const { data } = await axios.post('/api/users/signup', {
      email,
      password,
      name, // This is the farm name
      role
    });

    // Check if the role is 'supplier' and then create the farm
    if (role === 'supplier') {
      await axios.post('/api/farms', {
        name,
        emailAddress: email,
      });
    }

    login(data.userDetails); // Ensure userDetails includes the 'name' attribute

  } catch (error) {
    alert(error.message);
  }
};

async function loginUser(email, password) {
  try {
    const response = await axios.post('/api/users/login', {
      email,
      password,
      name
    });
    // Assuming your server responds with the user object and token upon successful authentication
    return response.data; // This will return the response data directly
  } catch (error) {
    // More detailed error handling
    let errorMessage = 'Login failed due to an unexpected error';
    if (error.response && error.response.data && error.response.data.message) {
      // Use the server-provided error message if available
      errorMessage = error.response.data.message;
    }
    throw new Error(errorMessage);
  }
}

async function registerUser(email, password, name, role) {
  try {
    console.log(name)
    console.log(role)
    const response = await axios.post('/api/users/signup', {
      email,
      password,
      name,
      role
    });
    // Assuming your server responds with status 201 and a success message upon user creation
    return response.data; // This will contain any data sent back from the server, such as a success message or the user object itself
  } catch (error) {
    // More nuanced error handling
    let errorMessage = 'Signup failed due to an unexpected error';
    console.log("-----")
    console.log(error.response)
    if (error.response) {
      // Include more error details if available and in development mode
      const isDevelopment = process.env.NODE_ENV === 'development'; // This might need adjustment based on your environment setup
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      if (isDevelopment && error.response.data && error.response.data.error) {
        errorMessage += ` - Details: ${error.response.data.error}`;
      }
    }
    throw new Error(errorMessage);
  }
}

const deleteAllUsers = async () => {
  if (window.confirm("Are you sure you want to delete all users? This action cannot be undone.")) {
    try {
      const response = await axios.delete('/api/users/deleteAll');
      alert(response.data); // Alert success message
    } catch (error) {
      // Error handling
      console.error("Error deleting all users:", error);
      alert("Failed to delete all users. Check the console for more details.");
    }
  }
};

  return (
    <div className="login-container">
      <h2>{isSigningUp ? 'Sign Up' : 'Login'}</h2>
      <form onSubmit={isSigningUp ? handleSignup : handleLogin}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {isSigningUp &&(
          <div>
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
        )}
        {isSigningUp && (
          <div>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="supplier">Supplier</option>
              <option value="employee">Employee</option>
              {/*<option value="admin">Admin</option>*/}
            </select>
          </div>
        )}

        <button className="add-button" type="submit">{isSigningUp ? 'Sign Up' : 'Login'}</button>
      </form>
      {/* 
      //<button className="danger-button" onClick={deleteAllUsers}>Delete All Users</button> 
      */}
      <button className="add-button" onClick={() => setIsSigningUp(!isSigningUp)}>
        {isSigningUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
}

export default Login;
