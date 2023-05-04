const pg = require('pg');

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const express = require('express');
const expressSession = require('express-session');


const app = express();
const port = 3003;
const cs = "postgres://postgres:admin@localhost:5432/recommendach";
const pgClient = new pg.Client(cs);

app.use(express.json());
app.use(cookieParser());
app.use(expressSession({
    secret: "secret1",
    resave: true,
    saveUninitialized: true
}));

pgClient.connect();

async function encryptPass(password){
    return new Promise((resolve) => {
        bcrypt.genSalt(10, (err, salt) =>{
            bcrypt.hash(password, salt, (err, hash) => {
                resolve(hash);
            })
        });
    });
}

async function comparePass(pass, hash){
    return new Promise((resolve) => {
        bcrypt.compare(pass, hash, (err, result) => {
            resolve(result);
        })
    });
}

app.get('/', (req, res) => {
    if(req.session.login)
        res.json('hi')
    else
        res.json('oops');
});

app.post('/api/login',(req, res)=>{
    const query = `SELECT * FROM "users" WHERE "login" = $1`
    const params = [req.body.login];
    pgClient.query(query,params,(err, result)=>{
        if(err){
            console.log(err);
        } else
            if(result.rowCount >0 ){
                comparePass(req.body.pass, result.rows[0].password).then(r =>{
                    if(r){
                        req.session.id    = result.id;
                        req.session.name  = result.rows[0].name;
                        req.session.login = true;
                        res.cookie("logged",true);
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
});

app.put('/api/register',async (req, res)=>{
    let hash = await encryptPass(req.body.password);
    const params = [req.body.name,req.body.login,hash,req.body.email]
    const query = 'INSERT INTO "users"("name","login","password","email") VALUES ($1, $2, $3, $4) RETURNING *'
    pgClient.query(query,params,(err, result)=>{
        if(err){
            console.log(err);
            res.status(500);
        } else {
            console.log(result);
            res.status(201);
        }
        res.send("done");
    })
});

app.post('/api/proforientation', async (req, res) => {
    const questions = req.body.questions;
    const recommendation_tags = [
        {title: 'Общежитие', value: 1, icon: 'mdi-home', color: 'success'},
        {title: 'Военная кафедра', value: 2, icon: 'mdi-account-tie-hat', color: 'green'},
        {title: 'Технический', value: 3, icon: 'mdi-wrench', color: 'primary'},
        {title: 'Гуманитарный', value: 4, icon: 'mdi-pen', color: 'orange'},
        {title: 'Медицинский', value: 5, icon: 'mdi-medical-bag', color: 'red'},
        {title: 'Военный', value: 6, icon: 'mdi-knife-military', color: 'green'},
        {title: 'Экономический', value: 7, icon: 'mdi-pen', color: 'orange'},
        {title: 'Естественные науки', value: 8, icon: 'mdi-pen', color: 'orange'},
    ];
    var result_tags = [];

    questions.forEach(question => console.log(question.answer));
    recommendation_tags.forEach(tag => {
        if(questions.some(question => question.answer.toLowerCase().includes(tag.title.toLowerCase())))
            result_tags.push(tag);
    });
    
    result_tags.forEach(tag => console.log("tag value:",tag.value));

    res.status(201);
    res.send(result_tags);
});

app.get('/api/proforientation', async (req, res) => {
    let tags = require("./rsc/recommendation_tags.json");
    let universities = require("./rsc/universities.json");

    res.status(200);
    res.send({
        tags: tags, 
        universities: universities
    });
});

app.get('/api/specializations', async (req, res) => {
    let specializations = require("./rsc/specializations.json");

    res.status(200);
    res.send(specializations);
});

app.listen(port,()=> {
    console.log(`Server running on port ${port}`);
});