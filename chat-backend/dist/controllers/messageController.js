"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveMessages = exports.sendMessage = void 0;
const messageModel_1 = require("../models/messageModel");
const sendMessage = (req, res, next) => {
    try {
        const { text } = req.body;
        const newItem = { id: Date.now(), text };
        messageModel_1.messages.push(newItem);
        res.status(201).json(newItem);
    }
    catch (error) {
        next(error);
    }
};
exports.sendMessage = sendMessage;
const receiveMessages = (req, res, next) => {
    try {
        res.json(messageModel_1.messages);
    }
    catch (error) {
        next(error);
    }
};
exports.receiveMessages = receiveMessages;
