const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override');
    uuid = require('uuid');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

let topMovies = [
    {
        title: 'Alien',
        director: 'Ridley Scott',
        genre: 'Science Fiction',
        year: '1979'
    },
    {
        title: 'Beau is Afraid',
        director: 'Ari Aster',
        genre: 'Horror',
        year: '2023'
    },
    {
        title: 'Hereditary',
        director: 'Ari Aster',
        genre: 'Horror',
        year: '2018'
    },
    {
        title: 'Scream',
        director: 'Wes Craven',
        genre: 'Horror',
        year: '1996'
    },
    {
        title: 'The Shining',
        director: 'Stanley Kubrick',
        genre: 'Horror',
        year: '1980'
    },
    {
        title: 'Laputa: Castle in the Sky',
        director: 'Hayao Miyazaki',
        genre: 'Fantasy',
        year: '1986'
    },
    {
        title: 'Princess Mononoke',
        director: 'Hayao Miyazaki',
        genre: 'Fantasy',
        year: '1997'
    },
    {
        title: 'Full Metal Jacket',
        director: 'Stanley Kubrick',
        genre: 'War',
        year: '1987'
    },
    {
        title: 'The Lighthouse',
        director: 'Robert Eggers',
        genre: 'Horror',
        year: '2019'
    },
    {
        title: 'Grave of the Fireflies',
        director: 'Isao Takahata',
        genre: 'War',
        year: '1988'
    }
];

let users = [
    {
        username: 'Patrick'
    }
];

app.use(morgan('common'));

app.get('/', (req, res) => {
    res.send('Welcome to my movie site!');
  });
  
app.get ('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/movies/:title', (req, res) => {
    res.json(topMovies.find((movie) =>
        { return movie.title === req.params.title }));
});

app.get('/movies/genre/:genre', (req, res) => {
    res.json(topMovies.filter((movie) =>
        { return movie.genre === req.params.genre }));
});

app.get('/movies/director/:director', (req, res) => {
    res.json(topMovies.filter((movie) =>
        { return movie.director === req.params.director }));
});

app.get('/users', (req, res) => {
    res.json(users);
});

app.post('/users', (req, res) => {
    let newUser = req.body;
    if (!newUser.username) {
        const message = 'Missing username in request body';
        res.status(400).send(message);
    } else {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).send(newUser);
    }
});

app.put('/users/:username', (req, res) => {
    let user = users.find((user) => { return user.username === req.params.username });
    if (user) {
        user.username = req.body.username;
        res.status(200).send('User updated.');
    } else {
        res.status(404).send('User not found.');
    }
});

app.post('/movies', (req, res) => {
    let newMovie = req.body;
    if (!newMovie.title) {
        const message = 'Missing title in request body';
        res.status(400).send(message);
    } else {
        newMovie.id = uuid.v4();
        topMovies.push(newMovie);
        res.status(201).send(newMovie);
    }
});

app.delete('/movies/:title', (req, res) => {
    let movie = topMovies.find((movie) => { return movie.title === req.params.title });
    if (movie) {
        topMovies = topMovies.filter((obj) => { return obj.title !== req.params.title });
        res.status(200).send('Movie deleted.');
    } else {
        res.status(404).send('Movie not found.');
    }
});

app.delete('/users/:username', (req, res) => {
    let user = users.find((user) => { return user.username === req.params.username });
    if (user) {
        users = users.filter((obj) => { return obj.username !== req.params.username });
        res.status(200).send('User deleted.');
    } else {
        res.status(404).send('User not found.');
    }
});
app.use((req, res, next) => {
    if (req.path.substr(-1) === '/' && req.path.length > 1) {
        const query = req.url.slice(req.path.length);
        res.redirect(301, req.path.slice(0, -1) + query);
    } else {
        next();
    }
});

app.use(express.static('public'));

app.use(methodOverride());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});