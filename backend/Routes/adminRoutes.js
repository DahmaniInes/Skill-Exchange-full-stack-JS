const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const adminController = require('../Controllers/AdminController');

// Validation middleware
const validateUpdateUser = [
    check('role')
        .optional()
        .isIn(['user', 'admin', 'super-admin'])
        .withMessage('Invalid role'),
    check('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
];


router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.searchUsers);
router.put('/users/:id', validateUpdateUser, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/export', adminController.exportUsers);
router.get('/monthly', adminController.getMonthlyUserRegistrations);


module.exports = router;