// Convert number to words for check amount
export function convertToWords(num) {
    const ones = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
        'seventeen', 'eighteen', 'nineteen'
    ];

    const tens = [
        '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];

    const thousands = ['', 'thousand', 'million', 'billion'];

    if (num === 0) return 'zero dollars';

    let words = '';
    let numStr = Math.floor(num).toString();

    // Handle cents
    const cents = Math.round((num % 1) * 100);
    let centsWords = '';

    if (cents > 0) {
        if (cents < 20) {
            centsWords = ones[cents];
        } else {
            centsWords = tens[Math.floor(cents / 10)];
            if (cents % 10 > 0) {
                centsWords += '-' + ones[cents % 10];
            }
        }
    }

    // Convert whole dollars
    let groups = [];
    while (numStr.length > 0) {
        groups.push(numStr.slice(-3));
        numStr = numStr.slice(0, -3);
    }

    groups.reverse().forEach((group, index) => {
        const groupNum = parseInt(group, 10);
        if (groupNum > 0) {
            const hundreds = Math.floor(groupNum / 100);
            const remainder = groupNum % 100;

            if (hundreds > 0) {
                words += ones[hundreds] + ' hundred ';
            }

            if (remainder > 0) {
                if (remainder < 20) {
                    words += ones[remainder] + ' ';
                } else {
                    words += tens[Math.floor(remainder / 10)] + ' ';
                    if (remainder % 10 > 0) {
                        words += ones[remainder % 10] + ' ';
                    }
                }
            }

            words += thousands[groups.length - 1 - index] + ' ';
        }
    });

    words = words.trim();

    // Add "dollars" and cents
    if (words === 'one') {
        words += ' dollar';
    } else {
        words += ' dollars';
    }

    if (cents > 0) {
        words += ' and ' + centsWords + '/100';
    } else {
        words += ' and 00/100';
    }

    return words;
}

// Validate routing number
export function validateRoutingNumber(routing) {
    if (!/^\d{9}$/.test(routing)) return false;

    // ABA routing number validation
    const digits = routing.split('').map(Number);
    const weights = [3, 7, 1];
    let sum = 0;

    for (let i = 0; i < digits.length - 1; i++) {
        sum += digits[i] * weights[i % 3];
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[8];
}

// Generate random check number
export function generateCheckNumber(start = 1001) {
    return (start + Math.floor(Math.random() * 9000)).toString();
}

// Format date for check
export function formatCheckDate(date = new Date()) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Create security patterns
export function createSecurityPattern(type = 'geometric') {
    const patterns = {
        geometric: {
            type: 'pattern',
            pattern: 'diagonalLines',
            color: 'rgba(200, 200, 200, 0.1)',
            spacing: 10,
            angle: 45
        },
        microprint: {
            type: 'text',
            text: 'SECURE CHECK',
            fontSize: 4,
            color: 'rgba(150, 150, 150, 0.05)',
            repeat: true
        },
        watermark: {
            type: 'image',
            opacity: 0.1,
            position: 'center'
        }
    };

    return patterns[type] || patterns.geometric;
}