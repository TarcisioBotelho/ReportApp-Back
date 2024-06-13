import express from 'express';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';

const router = express.Router();

router.use('/admin', adminRoutes);
router.use('/', userRoutes);

router.get ('/ping', (req, res) => {
    res.json({ pong: true });
});

router.get('/', (req, res) => {
    res.json({ homepage: true });
});

export default router;