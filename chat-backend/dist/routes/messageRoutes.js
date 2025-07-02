"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController_js_1 = require("../controllers/messageController.js");
const router = (0, express_1.Router)();
router.get('/', messageController_js_1.receiveMessages);
router.post('/', messageController_js_1.sendMessage);
exports.default = router;
