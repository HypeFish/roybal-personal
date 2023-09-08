const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the 'assets' directory
const publicPath = path.resolve(__dirname, 'assets');
app.use(express.static(path.join(__dirname, 'assets')));
console.log(publicPath);

// Serve the main entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the error page
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
