const mysql = require('mysql2/promise');

const passwords = [
  'Abcd123', 'Abcd@123', 'abcd@123', 'abcd123', 'Abcd1234', 'Abcd@1234',
  'dharmveer01', 'dharmveer01@123', 'dharmveer01@1234', 'dharmveer', 'dharmveer123', 'dharmveer@123',
  'Lenovo', 'Lenovo123', 'Lenovo@123', 'lenovo', 'lenovo123', 'lenovo@123',
  'root@97', 'root97', 'mysql97', 'mysql@97', 'stpi97', 'stpi@97', 'nerve97', 'nerve@97'
];

const test = async () => {
  for (const pw of passwords) {
    try {
      const conn = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: pw
      });
      console.log(`SUCCESS! The correct password is: "${pw}"`);
      await conn.end();
      process.exit(0);
    } catch (e) {
      // quiet fail
    }
  }
  console.log('All passwords in MongoDB-based dictionary failed.');
  process.exit(1);
};

test();
