

const express = require("express");
const router = express.Router();


const controller = require("../controllers/planController.js");

router.get('/', planController.getAll)

module.exports = router;