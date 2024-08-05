import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [editMode, setEditMode] = useState(null); // Track the user being edited
    const [formData, setFormData] = useState({ username: '', email: '', password: '', currentPassword: '' });
    const navigate = useNavigate();  // Hook for navigation
    const [showPopup, setShowPopup] = useState(false);


    // Handle login
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
            setError('');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    // Fetch users and check current user on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/users', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                console.log('Fetched users:', response.data); // Debugging line
                setUsers(response.data);
            } catch (err) {
                console.error('Error fetching users:', err); // Debugging line
                setError('Failed to fetch users.');
            }
        };

        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser) {
            setUser(currentUser);
            if (currentUser.role === 'admin') {
                fetchUsers();
            }
        }
    }, []); // Empty dependency array

    // Handle edit button
    const handleEdit = (user) => {
        setEditMode(user.user_id); // Set editMode to the user ID
        setFormData({
            username: user.username,
            email: user.email,
            password: '',  // Reset password field
            currentPassword: ''
        });

        setShowPopup(true); 
    };

    const closePopup = () => {
        setShowPopup(false);
        setEditMode(null);
        setFormData({ username: '', email: '', password: '', currentPassword: '' }); // Clear form fields
    };
    
    // Handle form changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle profile update
    const handleUpdate = async (e) => {
        e.preventDefault();
        const updateData = { username: formData.username, email: formData.email };
        
        if (user.role !== 'admin') {
            if (!formData.currentPassword) {
                setError('Current password is required to update profile.');
                return;
            }
            updateData.currentPassword = formData.currentPassword;
        }
        
        if (formData.password) {
            updateData.password = formData.password;
        }

        // Admins should not be able to set passwords
        if (user.role === 'admin') {
            delete updateData.password;
        }
    
        const url = user.role === 'admin' ? `http://localhost:5000/users/${editMode}` : `http://localhost:5000/users/me`;
    
        try {
            await axios.put(url, updateData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (user.role === 'admin') {
                setUsers(users.map(u => u.user_id === editMode ? { ...u, ...updateData } : u));
            } else {
                setUser({ ...user, ...updateData });
            }

            closePopup(); // Close the popup
            setError('');
            setEditMode(null);
            setFormData({ username: '', email: '', password: '', currentPassword: '' }); // Clear form fields
            setError('');
            alert('Profile updated successfully.');
        } catch (err) {
            setError('Failed to update profile.');
        }
    };

    // Handle user deletion
    const handleDelete = async (userId) => {
        try {
            await axios.delete(`http://localhost:5000/users/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUsers(users.filter(user => user.user_id !== userId));
            alert('User deleted successfully.');
        } catch (err) {
            setError('Failed to delete user.');
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setUsername('');  // Clear username
        setPassword('');  // Clear password
        navigate('/login');
    };
    
    return (
        <div className="login-container">
            {!user ? (
                <form onSubmit={handleLogin}>
                    <h2>Login</h2>
                    {error && <p className="error">{error}</p>}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                </form>
            ) : (
                <div>
                    <h2>Welcome, {user.username}</h2>
                    {user.role === 'admin' ? (
                        <div>
                            <h3>Admin Dashboard</h3>
                            {error && <p className="error">{error}</p>}
                            <h3>User List</h3>
                            <ul>
                                {users.map((u) => (
                                    <li key={u.user_id}>
                                        {u.username} ({u.email})
                                        <button onClick={() => handleEdit(u)}>Edit</button>
                                        <button onClick={() => handleDelete(u.user_id)}>Delete</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div>
                            <h3>My Profile</h3>
                            <button onClick={() => handleEdit(user)}>Edit</button>
                        </div>
                    )}
                   {showPopup && (
    <div className="popup">
        <form onSubmit={handleUpdate}>
            <h2>Edit Profile</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
            />
            <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
            />
            {user.role !== 'admin' && (
                <>
                    <input
                        type="password"
                        name="password"
                        placeholder="New Password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <input
                        type="password"
                        name="currentPassword"
                        placeholder="Current Password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                    />
                </>
            )}
            {user.role === 'admin' && editMode && (
                <>
                    {/* Admin should not see password fields */}
                </>
            )}
            <button type="submit">Update</button>
            <button type="button" onClick={closePopup}>Cancel</button>
        </form>
    </div>
)}

                    <button onClick={handleLogout}>Logout</button>
                </div>
            )}
           {error && <p className="error">{error}</p>}
                <div className="footer-text">
                    Already have an account? <a href="/signup">Signup</a>
                </div>
            </div>
        
    );
};

export default Login;
