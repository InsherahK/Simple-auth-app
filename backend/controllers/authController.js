const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
require('dotenv').config();

const login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    userModel.getUserByUsername(username, async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }

        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const token = jwt.sign(
                    { userId: user.user_id, username: user.username, role: user.role },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: process.env.JWT_EXPIRY }
                );
                res.status(200).json({ token, user: { userId: user.user_id, username: user.username, email: user.email, role: user.role } });
            } else {
                res.status(401).json({ message: 'Invalid password.' });
            }
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    });
};

const signup = (req, res) => {
    const { username, email, password, role } = req.body;

    userModel.getUserByUsername(username, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }

            const user = { username, email, password: hashedPassword, role };
            userModel.createUser(user, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Internal server error' });
                }

                const token = jwt.sign(
                    { userId: result.insertId, username, role },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: process.env.JWT_EXPIRY }
                );
                res.status(201).json({ token, user: { userId: result.insertId, username, email, role } });
            });
        });
    });
};

module.exports = { login, signup };
