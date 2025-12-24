const express = require('express');
const router = express.Router();
const tierController = require('../controllers/tierController');

router.get('/', tierController.getTiers);

module.exports = router;
