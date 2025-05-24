db = db.getSiblingDB('mydatabase');  // Switch to the 'mydatabase' database

// Check if the users collection exists, and if not, insert the static user
db.createCollection('users');
db.users.find().count() === 0 && db.users.insertOne({
    email: 'alice@example.com',
    hash: '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DPLKXt1FYlwYpQW2G3cAwjKoh2WZK',  // hashed password
    username: 'alice',
    userID: '123'
});