const express = require('express')
//const cookieParsere = require('cookie-parser');
const app = express()
// const port = 8888
const port = process.env.PORT || 80;

app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
    res.status(200).json({field : 'value'})
    //res.send('Hello World!')
})

app.get('/play', (req, rees) => {
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})