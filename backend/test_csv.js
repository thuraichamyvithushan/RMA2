try {
    const { Parser } = require('json2csv');
    const parser = new Parser();
    const csv = parser.parse([{ a: 1, b: 2 }]);
    console.log('CSV Success:', csv);
} catch (err) {
    console.error('CSV Error:', err.message);
}
