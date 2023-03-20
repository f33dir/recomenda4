const express = require('express')
const app = express();
const port = 3002
const pg = require('pg')
const cs = "postgres://postgres:12345@localhost:5432/";
const pgClient = new pg.Client(cs);
pgClient.connect()

pgClient.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
    console.log(err ? err.stack : res.rows[0].message) // Hello World!
    pgClient.end()
})
app.use(express.json);
app.get('/',(req, res)=>{
    res.send('hello fucker')
})

app.post('/register',(req, res) =>{

})


app.listen(port,()=>
    {console.log(`running on port ${port}`)}
)