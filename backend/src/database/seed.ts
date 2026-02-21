import bcrypt from 'bcryptjs';
import { connectDatabase } from './connection';
import { User } from '../modules/users/user.model';
import { config } from '../config';

async function seedAdmin() {
  try {
    await connectDatabase();

    const existingAdmin = await User.findOne({ email: config.admin.seedEmail });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(config.admin.seedPassword, 10);

    const admin = new User({
      email: config.admin.seedEmail,
      passwordHash,
      name: 'System Administrator',
      roles: ['ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN'],
      status: 'ACTIVE',
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${config.admin.seedEmail}`);
    console.log(`   Password: ${config.admin.seedPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
