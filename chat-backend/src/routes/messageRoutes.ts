import { Router } from 'express';
import { receiveMessages, sendMessage } from '../controllers/messageController';
const router = Router();

router.get('/', receiveMessages);
router.post('/send', sendMessage);

export default router;