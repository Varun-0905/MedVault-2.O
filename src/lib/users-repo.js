import bcrypt from 'bcryptjs';
import connectDB from './mongodb.js';
import User from '../models/User.js';

export async function getUserByEmail(email) {
  try {
    await connectDB();
    const user = await User.findByEmail(email);
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error('Failed to fetch user');
  }
}

export async function createUser({ email, name, passwordHash, role }) {
  try {
    await connectDB();
    
    const newUser = new User({
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: role || 'student',
      mentalHealth: {
        sessionsCompleted: 0,
        appointmentsBooked: 0
      }
    });
    
    const savedUser = await newUser.save();
    
    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      throw new Error('Email already exists');
    }
    
    throw new Error('Failed to create user');
  }
}

export async function getUserById(id) {
  try {
    await connectDB();
    const user = await User.findById(id);
    if (!user) return null;
    
    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

export async function getAllTherapists() {
  try {
    await connectDB();
    // TODO: Create Therapist model and query
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error getting therapists:', error);
    return [];
  }
}

export async function getAllCounselors() {
  try {
    await connectDB();
    // TODO: Create Counselor model and query
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error getting counselors:', error);
    return [];
  }
}

export async function getAllAdvisors() {
  try {
    await connectDB();
    // TODO: Create Advisor model and query
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error getting advisors:', error);
    return [];
  }
}

// Helper function to create initial admin and student users
export async function createInitialAdmin() {
  try {
    await connectDB();

    const upsertDemoUser = async ({ email, name, role, password }) => {
      const normalizedEmail = email.toLowerCase();
      const passwordHash = await bcrypt.hash(password, 12);

      return User.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: {
            email: normalizedEmail,
            name,
            role,
            isActive: true,
            passwordHash,
            mentalHealth: {
              sessionsCompleted: 0,
              appointmentsBooked: 0,
            },
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    };

    const adminUser = await upsertDemoUser({
      email: 'admin@college.edu',
      name: 'System Administrator',
      role: 'admin',
      password: 'admin123',
    });

    await upsertDemoUser({
      email: 'student@college.edu',
      name: 'Demo Student',
      role: 'student',
      password: 'student123',
    });

    if (!adminUser) {
      throw new Error('Failed to initialize demo admin account');
    }

    const { passwordHash: _, ...adminWithoutPassword } = adminUser.toObject();
    return adminWithoutPassword;
  } catch (error) {
    console.error('Error creating initial users:', error);
    throw error;
  }
}

// Helper function to update user's last login
export async function updateUserLastLogin(userId) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (user) {
      await user.updateLastLogin();
    }
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}