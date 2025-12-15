import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    // Return empty list or mock notifications for now
    res.json([
        { id: 1, title: 'RIUM 쇼핑몰 오픈', content: 'RIUM 쇼핑몰이 오픈했습니다.', is_active: true, created_at: new Date() }
    ]);
});

export default router;
