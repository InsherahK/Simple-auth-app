const connection = require('../config/db');

function getUserById(id, callback) {
    connection.query('SELECT * FROM Users WHERE user_id = ?', [id], callback);
}

function getUserByUsername(username, callback) {
    connection.query('SELECT * FROM Users WHERE username = ?', [username], callback);
}

function createUser(user, callback) {
    const insertQuery = 'INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)';
    connection.query(insertQuery, [user.username, user.email, user.password, user.role], callback);
}

function updateUser(id, user, callback) {
    connection.query('UPDATE Users SET ? WHERE user_id = ?', [user, id], callback);
}

function deleteUser(id, callback) {
    connection.query('DELETE FROM Users WHERE user_id = ?', [id], callback);
}

function getAllUsers(callback) {
    connection.query("SELECT * FROM Users WHERE role != 'admin'", callback);
}

module.exports = {
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser,
    getAllUsers
};
