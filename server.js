const { randomUUID } = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
const util = require('util');

const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

const readFromFile = util.promisify(fs.readFile);

const writeToFile = (destination, content) =>
  fs.writeFile(destination, JSON.stringify(content, null, 4), (err) =>
    err ? console.error(err) : console.info(`\nData written to ${destination}`)
  );

const readAndAppend = (content, file) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const parsedData = JSON.parse(data);
      parsedData.push(content);
      writeToFile(file, parsedData);
    }
  });
};

// GET route for homepage
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/index.html'))
);

// GET route for notes.html
app.get('/notes', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/notes.html'))
);

app.get('/api/notes', (req, res) => {
  console.info(`${req.method} request received for notes`);
  readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data)));
});

app.post('/api/notes', (req, res) => {
  console.info(`${req.method} request received to add a note`);

  const { title, text, id } = req.body;

  if (req.body) {
    const newNote = {
      title,
      text,
      id: randomUUID()
    };
    console.log(newNote);

    readAndAppend(newNote, './db/db.json');
    res.json('Note added successfully');
  } else {
    res.error('Error in adding note');
  }
});

app.delete('/api/notes/:id', (req, res) => {
  const idValue = req.params.id;
  fs.readFile(path.join(__dirname, './db/db.json'), "utf8", (err, note) => {
    if (err) throw err;
    let dbNotes = JSON.parse(note);
    const newDbNotes = dbNotes.filter((note) => note.id !== idValue);
    res.send(newDbNotes);

    fs.writeFile(path.join(__dirname, './db/db.json'), JSON.stringify(newDbNotes, null, 2), (err) => {
      if (err) throw err;
    })
  });
});

// Wildcard route that points to homepage
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/index.html'))
);

// PORT listener
app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT} 🚀`)
);