const express = require('express');
const { signUp, login, updatePassword, updateDetails, deleteDetails, forgotPassword,resetPassword } = require('../controllers/userControllers');

const router = express.Router();

router.post('/signUp', signUp);
router.post('/login', login);
router.post('/updatePassword/:id',updatePassword);
router.put('/updateDetails/:id',updateDetails);
router.post('/forgotPassword',forgotPassword);
router.post('/resetPassword/:id/:token',resetPassword);
router.delete('/deleteDetails/:id',deleteDetails);

module.exports = router;