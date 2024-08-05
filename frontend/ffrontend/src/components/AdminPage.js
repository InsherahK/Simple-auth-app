import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [editMode, setEditMode] = useState(null);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/users', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setUsers(response.data);
            } catch (err) {
                setError('Failed to fetch users.');
            }
        };

        fetchUsers();
    }, []);

    const handleEdit = (user) => {
        setEditMode(user.user_id);
        setFormData({
            username: user.username,
            email: user.email,
            password: ''
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/users/${editMode}`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUsers(users.map(user => user.user_id === editMode ? { ...user, ...formData } : user));
            setEditMode(null);
            setFormData({ username: '', email: '', password: '' });
            alert('User updated successfully.');
        } catch (err) {
            setError('Failed to update user.');
        }
    };

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

    return (
        <div className="admin-container">
            <h2>Admin Dashboard</h2>
            {error && <p className="error">{error}</p>}
            <ul>
                {users.map(user => (
                    <li key={user.user_id}>
                        {editMode === user.user_id ? (
                            <form onSubmit={handleSubmit}>
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
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button type="submit">Update</button>
                                <button type="button" onClick={() => setEditMode(null)}>Cancel</button>
                            </form>
                        ) : (
                            <>
                                <p>Username: {user.username}</p>
                                <p>Email: {user.email}</p>
                                <button onClick={() => handleEdit(user)}>Edit</button>
                                <button onClick={() => handleDelete(user.user_id)}>Delete</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminPage;
