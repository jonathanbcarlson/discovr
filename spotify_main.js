const express = require('express')
//const cookieParsere = require('cookie-parser');
const app = express()
const port = 8888
const spotifyId = '4934dfba9b1f4124918b14b0c038088a'
const spotifySecret = 'cb33806f47844ad1b1271830f04ff58b'

app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
    res.status(200).json({field : 'value'})
    //res.send('Hello World!')
})

app.get('/play', (req, rees) => {
})

app.listen(port, () => {
  console.log(`Example app listening at https://localhost/${port}`)
})