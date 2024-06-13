import express from 'express';
import * as UC from '../controllers/userController';

const router = express.Router();

//  User routes. ↓↓↓

router.post('/register', UC.register);
router.post('/login', UC.login);
router.post('/update-user-info', UC.updateUserInfo);
router.post('/delete-user', UC.deleteUser);

router.get('/profile', UC.myProfile);


//  User 'report' routes. ↓↓↓

router.get('/type-list', UC.typeList);
router.get('/reports', UC.myReports);
router.get('/report/:id', UC.myReport);

router.post('/add-report', UC.addReport);
router.post('/update-report', UC.updateReport);
router.post('/delete-report', UC.deleteReport);

export default router;