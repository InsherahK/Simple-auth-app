require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Create a connection to the database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
}

// Middleware to check if user is admin or owner
const ownsOrAdmin = (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    if (req.user.role === 'admin' || req.user.userId === userId) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
};

// Endpoint to get all users - Admin only
app.get('/users', authenticateToken, isAdmin, (req, res) => {
    connection.query("SELECT * FROM Users WHERE role != 'admin'", (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
        res.status(200).json(results);
    });
});

// Endpoint to get current user's data
app.get('/users/me', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    connection.query('SELECT * FROM Users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(results[0]);
    });
});



// Endpoint to get a single user by ID - Admin and owner only
app.get('/users/:id', authenticateToken, ownsOrAdmin, (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM Users WHERE user_id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(results[0]);
    });
});

// Endpoint to create a new user - No restriction
app.post('/signup', (req, res) => {
    const { username, email, password, role } = req.body;

    // Check if the user already exists
    connection.query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, email], (err, results) => {
        if (err) {
            console.error('Error checking existing user:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length > 0) {
            console.error('Username or email already exists');
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            const insertQuery = 'INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)';
            connection.query(insertQuery, [username, email, hashedPassword, role], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                const token = jwt.sign({ userId: result.insertId, username, role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
                res.status(201).json({ token, user: { userId: result.insertId, username, email, role } });
            });
        });
    });
});

// Endpoint to update current user's data
app.put('/users/me', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newUsername, newEmail, newPassword } = req.body;

    // Check if currentPassword is provided
    if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to update profile.' });
    }

    // Fetch the existing user from the database
    connection.query('SELECT * FROM Users WHERE user_id = ?', [userId], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = results[0];

        // Compare the provided current password with the stored password
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(403).json({ message: 'Current password is incorrect.' });
        }

        // Prepare the updated user data
        const updateData = {
            username: newUsername || user.username,
            email: newEmail || user.email,
            password: newPassword ? await bcrypt.hash(newPassword, 10) : user.password
        };

        connection.query('UPDATE Users SET ? WHERE user_id = ?', [updateData, userId], (err) => {
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
});

// Endpoint to update user data by admin or the user themselves
app.put('/users/:id', authenticateToken, ownsOrAdmin, (req, res) => {
    const { id } = req.params;
    const { username, email, password, currentPassword } = req.body;

    // Verify current password if the user is not an admin
    if (req.user.role !== 'admin' && password) {
        connection.query('SELECT password FROM Users WHERE user_id = ?', [id], async (err, results) => {
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

        connection.query('UPDATE Users SET ? WHERE user_id = ?', [updateData, id], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.status(200).json({ message: 'User updated successfully' });
        });
    }
});


// Endpoint to delete a user - Admin and owner only
app.delete('/users/:id', authenticateToken, ownsOrAdmin, (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM Users WHERE user_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    });
});

// Endpoint for user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    connection.query('SELECT * FROM Users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }

        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const token = jwt.sign({ userId: user.user_id, username: user.username, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
                res.status(200).json({ token, user: { userId: user.user_id, username: user.username, email: user.email, role: user.role } });
            } else {
                res.status(401).json({ message: 'Invalid password.' });
            }
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
