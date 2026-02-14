const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'date', 'amount', 'signature', 'micr'],
        required: true
    },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number },
    fontSize: { type: Number, default: 12 },
    fontFamily: { type: String, default: 'Arial' },
    color: { type: String, default: '#000000' },
    align: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'left'
    },
    defaultValue: { type: String },
    required: { type: Boolean, default: false },
    validation: { type: String },
    placeholder: { type: String }
});

const templateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['personal', 'business', 'premium', 'security', 'custom'],
        default: 'personal'
    },
    description: String,
    thumbnail: String,
    background: String,
    fields: [fieldSchema],
    security: {
        watermark: { type: Boolean, default: false },
        microprint: { type: Boolean, default: false },
        pattern: String,
        micrFont: { type: Boolean, default: true }
    },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        isPublic: { type: Boolean, default: false },
        usageCount: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 }
    },
    price: { type: Number, default: 0 },
    tags: [String],
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Template', templateSchema);
