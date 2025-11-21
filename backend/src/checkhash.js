// backend/checkHash.js
const bcrypt = require('bcryptjs');

const plain = 'admin123'; // mật khẩu mà bạn thử
const hash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Ko6lY4lHZkZT9e5WZ4lVJvM8zDyVy'; // dán password_hash từ DB vào đây

bcrypt.compare(plain, hash)
  .then(ok => console.log('bcrypt.compare ->', ok))
  .catch(err => console.error(err));
