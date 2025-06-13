const express = require('express');
const { getUsers, addUser } = require('../controllers/user.controller');

const router = express.Router();

router.get('/', getUsers);
router.post('/', addUser);

module.exports = router;
