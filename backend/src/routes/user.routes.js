const express = require('express');
const { searchUsers } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/search', searchUsers);

module.exports = router;
