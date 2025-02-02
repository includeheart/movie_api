const express = require('express'),
morgan = require('morgan'),
fs = require('fs'),
path = require('path'),
bodyParser = require('body-parser'),
methodOverride = require('method-override');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));

let topMovies = [
    {
        title: 'Alien',
        director: 'Ridley Scott',
        year: '1979'
    },
    {
        title: 'Beau is Afraid',
        director: 'Ari Aster',
        year: '2023'
    },
    {
        title: 'Hereditary',
        director: 'Ari Aster',
        year: '2018'
    },
    {
        title: 'Scream',
        director: 'Wes Craven',
        year: '1996'
    },
    {
        title: 'The Shining',
        director: 'Stanley Kubrick',
        year: '1980'
    },
    {
        title: 'Laputa: Castle in the Sky',
        director: 'Hayao Miyazaki',
        year: '1986'
    },
    {
        title: 'Princess Mononoke',
        director: 'Hayao Miyazaki',
        year: '1997'
    },
    {
        title: 'Full Metal Jacket',
        director: 'Stanley Kubrick',
        year: '1987'
    },
    {
        title: 'The Lighthouse',
        director: 'Robert Eggers',
        year: '2019'
    },
    {
        title: 'Grave of the Fireflies',
        director: 'Isao Takahata',
        year: '1988'
    }
];

app.use(morgan('common'));

app.get('/', (req, res) => {
    res.send('Welcome to my movie site!');
  });
  
app.get ('/movies', (req, res) => {
    res.json(topMovies);
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

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});