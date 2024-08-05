// src/HomePage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ... (existing imports)

const HomePage = () => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                setUser(userData);
                if (userData.role === 'admin') {
                    const response = await axios.get('http://localhost:5000/users', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    setUsers(response.data);
                }
            } catch (err) {
                setError('Failed to fetch data.');
            }
        };

        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDeleteUser = async (userId) => {
        try {
            await axios.delete(`http://localhost:5000/users/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUsers(users.filter(user => user.user_id !== userId));
        } catch (err) {
            setError('Failed to delete user.');
        }
    };

    return (
        <div className="home-container">
            <h2>Welcome, {user?.username}</h2>
            <button onClick={handleLogout}>Logout</button>
            {error && <p className="error">{error}</p>}
            <button onClick={() => navigate('/profile')}>Go to Profile</button>
            {user?.role === 'admin' && (
                <div>
                    <h3>Users List</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.user_id}>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <button onClick={() => handleDeleteUser(user.user_id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HomePage;
