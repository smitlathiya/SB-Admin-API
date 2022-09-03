const express = require('express')
var cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
const dotenv = require('dotenv')
const fs = require('fs')
dotenv.config()
const app = express();


//db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })
    .then(() => console.log('DB Connected'))
mongoose.connection.on('error', err => {
    console.log(`db Connection error ${err.message}`)
})

const bodyParser = require('body-parser')
const postRoutes = require('./routes/posts')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')

app.get('/', (req, res) => {
    fs.readFile('Docs/docs.json', (err, data) => {
        if (err) res.status(400).json({ error: err })

        const docs = JSON.parse(data)
        res.json(docs);
    })
})

//middleware
app.use(morgan("dev"))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(cors())
app.use("/", postRoutes)
app.use("/", authRoutes)
app.use("/", userRoutes)
app.use(function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        res.status(401).json({ error: "Please Login" });
    } else {
        next(err);
    }
});


const port = process.env.PORT || 3100
app.listen(port, () => console.log(`API is listening on Port: ${port}`))

