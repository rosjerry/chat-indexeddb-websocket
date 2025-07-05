import { Router } from 'express';
import { receiveMessages, sendMessage } from '../controllers/messageController';
const router = Router();

router.get('/', receiveMessages);
router.post('/', sendMessage);

export default router;