const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['user', 'premium', 'admin'],
        default: 'user'
    },
    subscription: {
        plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'] },
        expiryDate: Date,
        paymentMethod: String,
        autoRenew: { type: Boolean, default: false }
    },
    usage: {
        checksGenerated: { type: Number, default: 0 },
        templatesCreated: { type: Number, default: 0 },
        lastActive: Date
    },
    preferences: {
        defaultTemplate: String,
        autoSave: { type: Boolean, default: true },
        exportQuality: {
            type: String,
            enum: ['low', 'medium', 'high', 'print'],
            default: 'medium'
        }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
