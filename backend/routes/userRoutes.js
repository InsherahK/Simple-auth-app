const express = require('express');
const {
    getAllUsers,
    getUser,
    getUserById,
    updateUser,
    updateUserById,
    deleteUser,
    updateProfile,
    uploadProfileImage 
} = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');
const { isAdmin, ownsOrAdmin } = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { updateProfileImage } = require('../controllers/userController');

const router = express.Router();

router.get('/', authenticateToken, isAdmin, getAllUsers);
router.get('/me', authenticateToken, getUser);
router.get('/:id', authenticateToken, ownsOrAdmin, getUserById);
router.put('/me', authenticateToken, updateUser);
router.put('/:id', authenticateToken, ownsOrAdmin, updateUserById);
router.delete('/:id', authenticateToken, ownsOrAdmin, deleteUser);
router.post('/me/profile-image', authenticateToken, uploadMiddleware.single('profileImage'), uploadProfileImage);

module.exports = router;
