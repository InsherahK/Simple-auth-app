function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
}

function ownsOrAdmin(req, res, next) {
    const userId = parseInt(req.params.id, 10);
    if (req.user.role === 'admin' || req.user.userId === userId) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
}

module.exports = { isAdmin, ownsOrAdmin };
