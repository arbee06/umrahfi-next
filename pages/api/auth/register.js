import { User, syncDatabase } from '@/models';
import { createToken, setTokenCookie } from '@/utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database is synced
    await syncDatabase();

    const { name, email, password, role, companyName, companyLicense, companyAddress, phone, address, country } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (!['customer', 'company'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'company' && (!companyName || !companyLicense || !companyAddress)) {
      return res.status(400).json({ error: 'Company information is required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      phone,
      address,
      country
    };

    if (role === 'company') {
      userData.companyName = companyName;
      userData.companyLicense = companyLicense;
      userData.companyAddress = companyAddress;
    }

    const user = await User.create(userData);

    // Create token
    const token = createToken(user.id, user.role);
    setTokenCookie(res, token);

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
}