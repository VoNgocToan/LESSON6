const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async(req, res) => {
    try {
        const { username, password } = req.body;
        // Kiểm tra username đã tồn tại
        const existingUser = await User.findOne({ username });
        const user = new User({ username, password });
        await user.save();
        res.json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(400).json({ error: 'User registration failed', details: err.message });
    }
});

// Login
router.post('/login', async(req, res) => {
    try {
        const { username, password } = req.body;
        // Tìm user theo username
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Lưu session
        req.session.userId = user._id;

        // Express session will auto set cookie, but let's send a confirmation
        res.cookie('sid', req.sessionID, {
            httpOnly: true,
            secure: false, // set to true if using https
            maxAge: 1000 * 60 * 60,
        });

        res.json({ message: 'Login successful!' });
    } catch (err) {
        res.status(500).json({
            error: 'Login failed',
            details: err.message
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        // Clear cookies
        res.clearCookie('sid');
        res.clearCookie('connect.sid'); // default session cookie name
        res.json({ message: "Logout successful!" });
    });
});

//protected route 
router.get('/profile', async(req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.session.userId).select('-password');
    res.json({ user });
});

module.exports = router;