const express = require('express');
const farmController = require('C:/Go/Farm/server/src/controllers/farmController.js');
const { authenticateToken } = require('C:/Go/Farm/server/src/middleware/auth.js');

const router = express.Router();

router.use(authenticateToken);

router.get('/state', farmController.getState);
router.post('/plant', farmController.plant);
router.post('/water', farmController.water);
router.post('/harvest', farmController.harvest);
router.get('/layout', farmController.getLayout);
router.post('/layout', farmController.saveLayout);

module.exports = router;
