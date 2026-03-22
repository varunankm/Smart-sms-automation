const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../faculty.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
}

exports.register = (req, res) => {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }
    
    let users = [];
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(data);
    } catch (err) {}
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists, please login.' });
    }
    
    const newUser = { id: Date.now().toString(), name, email, password, department };
    users.push(newUser);
    fs.writeFileSync(usersFilePath, JSON.stringify(users));
    
    res.json({ message: 'Registration successful', user: { id: newUser.id, name: newUser.name, email: newUser.email, department: newUser.department } });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    let users = [];
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(data);
    } catch (err) {}
    
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, department: user.department } });
};
