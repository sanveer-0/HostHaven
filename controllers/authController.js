const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Fail fast if JWT_SECRET is not configured
if (!process.env.JWT_SECRET) {
    throw new Error('[Auth] JWT_SECRET is not set in environment variables. Add it to your .env file.');
}

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role: role || 'staff'
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user.id)
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user (with password)
        const user = await User.scope('withPassword').findOne({
            where: { email }
        });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user.id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('[Login Error]', error.message);
        // Don't expose internal JWT/env errors to the client
        const isInternalError = error.message.includes('secretOrPrivateKey') || error.message.includes('JWT');
        res.status(500).json({
            message: isInternalError
                ? 'Server configuration error. Please contact the administrator.'
                : error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { register, login, getMe };
