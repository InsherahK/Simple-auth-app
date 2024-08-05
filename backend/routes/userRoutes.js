const express = require('express');
const {
    getAllUsers,
    getUser,
    getUserById,
    updateUser,
    updateUserById,
    deleteUser
} = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');
const { isAdmin, ownsOrAdmin } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', authenticateToken, isAdmin, getAllUsers);
router.get('/me', authenticateToken, getUser);
router.get('/:id', authenticateToken, ownsOrAdmin, getUserById);
router.put('/me', authenticateToken, updateUser);
router.put('/:id', authenticateToken, ownsOrAdmin, updateUserById);
router.delete('/:id', authenticateToken, ownsOrAdmin, deleteUser);

module.exports = router;
