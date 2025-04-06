const User = require('../Models/User');
const AuditLog = require('../Models/Audit');
const { Parser } = require('json2csv'); // See more info at [json2csv](https://test.com)
const PDFDocument = require('pdfkit');   // See more info at [PDFKit](https://test.com)

class AdminService {


    // Fetch dashboard statistics (totals, recent activity, and latest users) for widgets above the table
    static async getDashboardStats() {
        try {
            const [totalUsers, activeUsers, latestUsers] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ isActive: true }),
                User.find().sort({ createdAt: -1 }).limit(5).lean()
            ]);

            const activity = await User.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $limit: 30 }
            ]);

            return {
                totals: { totalUsers, activeUsers },
                activity,
                latestUsers
            };
        } catch (error) {
            throw new Error(`Failed to get dashboard stats: ${error.message}`);
        }
    }


    static async searchUsers({
                                 page = 1,
                                 limit = 10,
                                 search = '',
                                 role,
                                 isActive,
                                 sortField = 'createdAt',
                                 sortOrder = 'desc'
                             }) {
        try {
            const query = {};

            // Add isActive filter (prioritize this filter)
            if (isActive !== undefined) {
                query.isActive = isActive;
            }

            // Add search logic (only if search is provided)
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            // Add role filter (only if role is provided)
            if (role) {
                query.role = role;
            }

            // Setup dynamic sorting options
            const sortOptions = {};
            sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

            // Fetch users and total count
            const [users, total] = await Promise.all([
                User.find(query)
                    .sort(sortOptions)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .select('-password') // Exclude password field
                    .lean(),
                User.countDocuments(query)
            ]);

            return {
                data: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`User search failed: ${error.message}`);
        }
    }
    // Update a given user record and log the audit entry. This is linked with inline editing in the table.
    static async updateUser(userId, updateData) {
        try {
            console.log("Mise à jour demandée pour l'utilisateur:", userId);
            console.log("Données à modifier:", updateData);

            const user = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            console.log("Utilisateur après mise à jour:", user);

            if (!user) throw new Error('User not found');

            await AuditLog.create({
                action: 'USER_UPDATE',
                target: userId,
                details: updateData
            });

            return user;
        } catch (error) {
            console.error("Erreur lors de la mise à jour :", error.message);
            throw new Error(`Update failed: ${error.message}`);
        }
    }

    // Delete a user record and log the deletion for audit purposes.
    static async deleteUser(userId) {
        try {
            const user = await User.findByIdAndDelete(userId);
            if (!user) throw new Error('User not found');

            await AuditLog.create({
                action: 'USER_DELETE',
                target: userId
            });

            return user;
        } catch (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }
    }

    // Export user data in either CSV or PDF format. The CSV export uses [json2csv](https://test.com)
    // while the PDF export uses [PDFKit](https://test.com).
    static async exportUsers(format = 'csv') {
        try {
            const users = await User.find().select('-password').lean();

            switch (format.toLowerCase()) {
                case 'csv': {
                    const parser = new Parser({
                        fields: ['firstName', 'lastName', 'email', 'role', 'createdAt']
                    });
                    return { data: parser.parse(users), type: 'text/csv' };
                }
                case 'pdf': {
                    return {
                        data: await this.generatePDF(users),
                        type: 'application/pdf'
                    };
                }
                default:
                    throw new Error('Unsupported export format');
            }
        } catch (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
    }

    static async generatePDF(users) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', reject);

                // Header
                doc.fontSize(18)
                    .text('Users Report', { align: 'center' })
                    .moveDown(0.5);

                // Table headers
                const headers = ['Name', 'Email', 'Role', 'Created At'];
                const columnWidths = [150, 200, 100, 100];

                doc.font('Helvetica-Bold')
                    .fontSize(12)
                    .text(headers.join(' | '), 50, 100)
                    .moveTo(50, 120)
                    .lineTo(550, 120)
                    .stroke();

                // Table content
                let y = 130;
                users.forEach((user, index) => {
                    if (index % 25 === 0 && index !== 0) {
                        doc.addPage();
                        y = 100;
                    }

                    doc.font('Helvetica')
                        .fontSize(10)
                        .text(
                            `${user.firstName} ${user.lastName} | ${user.email} | ${user.role} | ${new Date(user.createdAt).toLocaleDateString()}`,
                            50,
                            y
                        );

                    y += 20;
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
    static async getMonthlyUserRegistrations() {
        try {
            const currentYear = new Date().getFullYear();
            const monthlyData = [];

            for (let month = 0; month < 12; month++) {
                const startDate = new Date(currentYear, month, 1);
                const endDate = new Date(currentYear, month + 1, 0);

                console.log(`Querying for ${startDate.toLocaleString('en-US', { month: 'short' })}:`);
                console.log(`Start Date: ${startDate}`);
                console.log(`End Date: ${endDate}`);

                const count = await User.countDocuments({
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                });

                console.log(`Count: ${count}`);

                monthlyData.push({
                    month: startDate.toLocaleString('en-US', { month: 'short' }),
                    value: count
                });
            }

            return monthlyData;
        } catch (error) {
            throw new Error(`Failed to fetch monthly user registrations: ${error.message}`);
        }
    }


}

module.exports = AdminService;