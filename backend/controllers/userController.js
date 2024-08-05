const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

const getAllUsers = (req, res) => {
    userModel.getAllUsers((err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
        res.status(200).json(results);
    });
};

const getUser = (req, res) => {
    const userId = req.user.userId;
    userModel.getUserById(userId, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(results[0]);
    });
};

const getUserById = (req, res) => {
    const { id } = req.params;
    userModel.getUserById(id, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(results[0]);
    });
};

const updateUser = (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newUsername, newEmail, newPassword } = req.body;

    if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to update profile.' });
    }

    userModel.getUserById(userId, async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = results[0];
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(403).json({ message: 'Current password is incorrect.' });
        }

        const updateData = {
            username: newUsername || user.username,
            email: newEmail || user.email,
            password: newPassword ? await bcrypt.hash(newPassword, 10) : user.password
        };

        userModel.updateUser(userId, updateData, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }

            res.status(200).json({
                user_id: user.user_id,
                username: updateData.username,
                email: updateData.email,
                role: user.role,
                created_at: user.created_at,
                updated_at: new Date()
            });
        });
    });
};

const updateUserById = (req, res) => {
    const { id } = req.params;
    const { username, email, password, currentPassword } = req.body;

    if (req.user.role !== 'admin' && password) {
        userModel.getUserById(id, async (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            const match = await bcrypt.compare(currentPassword, results[0].password);
            if (!match) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            updateUser();
        });
    } else {
        updateUser();
    }

    function updateUser() {
        const updateData = { username, email };
        if (password) {
            updateData.password = bcrypt.hashSync(password, 10);
        }

        userModel.updateUser(id, updateData, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.status(200).json({ message: 'User updated successfully' });
        });
    }
};

const deleteUser = (req, res) => {
    const { id } = req.params;
    userModel.deleteUser(id, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    });
};

module.exports = {
    getAllUsers,
    getUser,
    getUserById,
    updateUser,
    updateUserById,
    deleteUser
};
