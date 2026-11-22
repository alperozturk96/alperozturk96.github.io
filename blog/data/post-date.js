const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function parsePostDate(value) {
    const match = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(value);
    if (!match) throw new TypeError(`Invalid post date: ${value}`);
    const day = Number(match[1]);
    const name = match[2].toLowerCase();
    const month = months.findIndex(month => month.toLowerCase() === name || month.slice(0, 3).toLowerCase() === name);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (month === -1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
        throw new RangeError(`Invalid post date: ${value}`);
    }

    return date;
}
