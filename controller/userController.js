const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModels');
const redisClient = require('../auth/redisClient');
const SECRET_KEY = process.env.SECRET_KEY;

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, SECRET_KEY);
};

const register = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Username already exists' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (user && await bcrypt.compare(password, user.password)) {
            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);
            res.json({ accessToken, refreshToken });
            // redisClient.set(user.id.toString(), refreshToken, 'EX', 604800, (err) => {
            //     if (err) {
            //         return res.status(500).json({ message: 'Error storing refresh token' });
            //     }
            //     res.json({ accessToken, refreshToken });
            // });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
}
const token = async (req, res) => {
    const { userId, refreshToken } = req.body;
    try {
        redisClient.get(userId.toString(), (err, storedToken) => {
            if (err || storedToken !== refreshToken) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }
            const newAccessToken = generateAccessToken(userId);
            res.json({ accessToken: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during token refresh' });
    }
};

module.exports = { register, login, token };
