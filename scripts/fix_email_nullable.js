const { sequelize } = require('../config/database');

async function fixEmailColumn() {
    try {
        // Pragma must run outside a transaction in SQLite
        await sequelize.query('PRAGMA foreign_keys = OFF');

        // Create new table without NOT NULL on email
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS guests_backup AS SELECT * FROM guests
        `);

        await sequelize.query(`
            CREATE TABLE guests_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NULL,
                phone VARCHAR(50) NOT NULL,
                address TEXT NOT NULL,
                idProofType VARCHAR(255) NOT NULL,
                idProofNumber VARCHAR(100) NOT NULL,
                checkInDate DATETIME,
                checkOutDate DATETIME,
                status VARCHAR(255) DEFAULT 'active',
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL
            )
        `);

        // Copy data
        await sequelize.query(`
            INSERT INTO guests_new SELECT id, name, email, phone, address, idProofType, idProofNumber, checkInDate, checkOutDate, status, createdAt, updatedAt FROM guests
        `);

        const [rows] = await sequelize.query('SELECT COUNT(*) as cnt FROM guests_new');
        console.log('Rows copied:', rows[0].cnt);

        await sequelize.query('DROP TABLE guests');
        await sequelize.query('ALTER TABLE guests_new RENAME TO guests');
        await sequelize.query('DROP TABLE IF EXISTS guests_backup');
        await sequelize.query('PRAGMA foreign_keys = ON');

        console.log('SUCCESS: guests.email column is now nullable');

        const cols = await sequelize.query('PRAGMA table_info(guests)', { type: sequelize.QueryTypes.SELECT });
        const emailCol = cols.find(c => c.name === 'email');
        console.log('email notnull:', emailCol.notnull, '→ should be 0');

    } catch (e) {
        console.error('FAILED:', e.message);
        await sequelize.query('PRAGMA foreign_keys = ON').catch(() => { });
    }

    process.exit(0);
}

fixEmailColumn();
