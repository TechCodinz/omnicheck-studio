export const convertToWords = (amount: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (amount === 0) return 'Zero';

    const [whole, decimal] = amount.toFixed(2).split('.');
    let n = parseInt(whole);

    const convertChunk = (num: number): string => {
        let str = '';
        if (num >= 100) {
            str += units[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }
        if (num >= 20) {
            str += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + units[num % 10] : '') + ' ';
        } else if (num > 0) {
            str += units[num] + ' ';
        }
        return str;
    };

    let result = '';
    let scaleIndex = 0;

    while (n > 0) {
        const chunk = n % 1000;
        if (chunk > 0) {
            result = convertChunk(chunk) + scales[scaleIndex] + ' ' + result;
        }
        n = Math.floor(n / 1000);
        scaleIndex++;
    }

    return `${result.trim()} and ${decimal}/100 Dollars`.toUpperCase();
};
