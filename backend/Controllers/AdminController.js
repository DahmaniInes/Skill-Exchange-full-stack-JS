const AdminService = require('../services/AdminService');


exports.getMonthlyUserRegistrations = async (req, res) => {
    try {
        const monthlyData = await AdminService.getMonthlyUserRegistrations();
        res.status(200).json(monthlyData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await AdminService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get dashboard stats',
            details: error.message
        });
    }
};

exports.searchUsers =  async (req, res) => {
    try {
        const { page, limit, search, role, isActive, sortField, sortOrder } = req.query;

        const result = await AdminService.searchUsers({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            search: search || '',
            role: role || '',
            isActive: isActive !== undefined ? isActive === 'true' : undefined, // Ensure isActive is parsed correctly
            sortField: sortField || 'createdAt',
            sortOrder: sortOrder || 'desc'
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await AdminService.updateUser(req.params.id, req.body);
        res.json(user);
    } catch (error) {
        res.status(404).json({
            error: 'Update failed',
            details: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await AdminService.deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(404).json({
            error: 'Delete failed',
            details: error.message
        });
    }
};

exports.exportUsers = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const { data, type } = await AdminService.exportUsers(format);

        res.set({
            'Content-Type': type,
            'Content-Disposition': `attachment; filename=users-export.${format}`
        });

        res.send(data);
    } catch (error) {
        res.status(400).json({
            error: 'Export failed',
            details: error.message
        });
    }
};