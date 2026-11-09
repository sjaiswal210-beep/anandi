"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.formatCurrency = formatCurrency;
exports.formatIndianNumber = formatIndianNumber;
exports.generateBookingNumber = generateBookingNumber;
exports.calculateLeadScore = calculateLeadScore;
exports.formatPhoneNumber = formatPhoneNumber;
exports.generateApiKey = generateApiKey;
exports.deepMerge = deepMerge;
exports.delay = delay;
exports.retryWithBackoff = retryWithBackoff;
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}
function formatIndianNumber(num) {
    if (num >= 10000000) {
        return `${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
        return `${(num / 100000).toFixed(2)} L`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)} K`;
    }
    return num.toString();
}
function generateBookingNumber() {
    const prefix = 'BK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
function calculateLeadScore(factors) {
    let score = 0;
    if (factors.hasEmail)
        score += 5;
    if (factors.hasPhone)
        score += 10;
    if (factors.hasBudget)
        score += 15;
    if (factors.hasTimeline)
        score += 10;
    if (factors.hasPreferredLocation)
        score += 10;
    const sourceScores = {
        REFERRAL: 20,
        WALK_IN: 18,
        WEBSITE: 15,
        GOOGLE_ADS: 12,
        FACEBOOK: 10,
        INSTAGRAM: 8,
        WHATSAPP: 8,
        COLD_CALL: 5,
        OTHER: 3,
    };
    score += sourceScores[factors.source] || 3;
    if (factors.responseTime <= 1)
        score += 10;
    else if (factors.responseTime <= 6)
        score += 7;
    else if (factors.responseTime <= 24)
        score += 3;
    score += Math.min(factors.engagementCount * 2, 10);
    score += Math.min(factors.visitCount * 5, 15);
    return Math.min(score, 100);
}
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned}`;
    }
    return phone;
}
function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const prefix = 'ros_';
    let key = '';
    for (let i = 0; i < 48; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${key}`;
}
function deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceVal = source[key];
            const targetVal = target[key];
            if (sourceVal &&
                typeof sourceVal === 'object' &&
                !Array.isArray(sourceVal) &&
                targetVal &&
                typeof targetVal === 'object' &&
                !Array.isArray(targetVal)) {
                output[key] = deepMerge(targetVal, sourceVal);
            }
            else {
                output[key] = sourceVal;
            }
        }
    }
    return output;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                const delayMs = baseDelay * Math.pow(2, attempt);
                await delay(delayMs);
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=index.js.map