import express from "express";
import * as AC from "../controllers/adminController";
import { getAllStatuses } from '../controllers/adminController';

const router = express.Router();

//  Admin routes. ↓↓↓

router.post('/login', AC.adminLogin);


//  Admin 'reports' routes. ↓↓↓

router.get('/reports', AC.getFilteredReports);

router.post('/add-type', AC.addtype);
router.post('/update-type', AC.updatetype);
router.post('/delete-type', AC.deletetype);

router.post('/add-status', AC.addStatus);
router.post('/update-status', AC.updateStatus);
router.post('/delete-status', AC.deleteStatus);

router.post('/change-status', AC.changeReportStatus);
router.get('/statuses', getAllStatuses);

export default router;