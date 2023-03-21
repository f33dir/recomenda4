const express = require('express')
const bodyParser = require('body-parser')
const app = express();
const port = 3003
const pg = require('pg')
const cs = "postgres://postgres:12345@localhost:5432/";
const pgClient = new pg.Client(cs);
app.use(bodyParser.json());
pgClient.connect()

pgClient.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
    console.log(err ? err.stack : res.rows[0].message) // Hello World!
    pgClient.end()
})
app.get('/',(req, res)=>{
    res.json('f u');
})

app.post('/register',(req, res) =>{

})


app.listen(port,()=>
    {console.log(`running on port ${port}`)}
)