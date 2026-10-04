const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validatePassword, validatePhone } = require('../utils/validation');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, city, address, role, lat, lng, accuracy } = req.body;

    if (!name || !email || !password || !phone || !city) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Password rule check
    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@, #, !, $, %). Example: Poornima@123',
      });
    }

    // Mobile number rule check
    if (!validatePhone(phone)) {
      return res.status(400).json({
        message: 'Mobile number must contain exactly 10 numerical digits.',
      });
    }

    const { validateCoordinates } = require('../utils/locationValidator');
    let locationData;
    if (lat !== undefined && lng !== undefined) {
      if (!validateCoordinates(lat, lng)) {
        return res.status(400).json({ message: 'Invalid GPS coordinates provided.' });
      }
        locationData = {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
          accuracy: Number(accuracy) || 0,
          timestamp: new Date()
        };
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      city,
      address: address || '',
      role: role || 'Food Donor',
      location: locationData
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        address: user.address,
        role: user.role,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        address: user.address,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/auth/profile/:id
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name role city stats createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getPublicProfile
};
