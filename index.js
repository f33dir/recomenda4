const bodyParser = require('body-parser')
const pg = require('pg')

const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const express = require('express')
const expressSession = require('express-session')

const app = express();
const port = 3003
const cs = "postgres://postgres:12345@localhost:5432/recommendach";
const pgClient = new pg.Client(cs);

app.use(express.json());
app.use(cookieParser());
app.use(expressSession({
    secret:"secret1",
    resave: true,
    saveUninitialized: true
}))

pgClient.connect()

async function encryptPass(password){
    return new Promise((resolve)=>{
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,(err,hash)=>{
            resolve(hash);
        })
    });
    })
}

async function comparePass(pass, hash){
    return new Promise((resolve)=>{
        bcrypt.compare(pass,hash,(err,result)=>{
            resolve(result);
        })
    })
}

app.get('/',(req, res)=>{
    if(req.session.login)
        res.json('hi')
    else
        res.json('f u');
})

app.post("/test",(req,res)=>{
})
app.post('/register',async (req, res) => {
    res.header('Access-Control-Allow-Origin',"*");
    let hash = await encryptPass(req.body.pass);
    const values = [req.body.login, hash,req.body.name , 0];
    const query = `INSERT INTO "User"("Login","Password","Name","User_type") VALUES ($1, $2, $3, $4) RETURNING *`;
    pgClient.query(query,values,(err, result)=>{
        if(err){
            console.log(err);
            res.status(500);
        } else
            console.log(result);
            res.status(201);
    })
})

app.post('/api/login',(req, res)=>{
    const query = `SELECT * FROM "User" WHERE "Login" = $1`
    const params = [req.body.login];
    pgClient.query(query,params,(err, result)=>{
        if(err){
            console.log(err);
        } else
            if(result.rowCount >0 ){
                comparePass(req.body.pass, result.rows[0].Password).then(r =>{
                    if(r){
                        req.session.id    = result.User_ID;
                        req.session.name  = result.rows[0].Name;
                        req.session.type  = result.rows[0].User_type;
                        req.session.login = true;
                        res.cookie("logged",true)
                        res.status(200);
                        res.send("done")
                    } else{
                        res.status(200);
                        res.send("done");
                    }
                }).catch(err =>{
                    console.log(err);
                })
            } else {
                res.status(200)
                res.send("user not found")
            }
    })
})



app.listen(port,()=> {
    console.log(`running on port ${port}`)
})