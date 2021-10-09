const express = require('express')
const mongoose = require('mongoose')
const moment = require('moment');
const shortId = require("shortid");
const app = express()
const cors = require('cors')
require('dotenv').config()

const { Schema } = mongoose;

app.use(express.urlencoded({
  extended: true
}))

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(mongoose.connection.readyState)



const personSchema = new Schema({
  name: { type: String, required: true, default: shortId.generate },
  count: { type: Number, default: 0 },
  log:[{
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
  },
}]
})

let Person = mongoose.model("Person", personSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  var someone = new Person({ name: req.body.username });
  someone.save();
  res.json(
    {
      username: req.body.username,
      _id: someone._id
    });
})

// const exerciseSchema = new Schema(
//   {
//     description: { type: String, required: true },
//     duration: { type: Number, required: true },
//     date: String,
//     userId: String,
//   }
// )

// let Exercise = mongoose.model("Exercise", exerciseSchema);


app.post("/api/users/:_id/exercises", async (req, res) => {
 
  let {description, duration, date } = req.body;
  let id = req.params._id;
  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  try {
    let findOne = await Person.findOne({
      _id: id
    });
    // If user exists, add exercise
    if (findOne) {
      // console.log("Retrieving Stored User");
      findOne.count++;
      findOne.log.push({
        description: description,
        duration: parseInt(duration),
        date: date
      });

      findOne.save();

      res.json({
        _id: id,
        username: findOne.name,
        date: date,
        duration: parseInt(duration),
        description: description,
      });

    }
    // If user doesn't exist, return error
  } catch (err) {
    console.error(err);
  }
});

app.get("/api/users", (req, res) => {
  Person.find({}, function (err, docs) {
    if (err) return console.log(err);
    let allUsers = [];
    docs.forEach((item) => {
      let userObj = {
        username: item.name,
        _id: item._id
      }
      allUsers.push(userObj);
    })
    res.send(allUsers);
  });
})


app.get("/api/users/:_id/logs", (req, res) => {
  Person.findById(req.params._id, (error, result) => {
    if (!error) {
      let resObj = result;

      if (req.query.from || req.query.to) {
        let fromDate = new Date(0);
        let toDate = new Date();

        if (req.query.from) {
          fromDate = new Date(req.query.from);
        }

        if (req.query.to) {
          toDate = new Date(req.query.to);
        }

        fromDate = fromDate.getTime();
        toDate = toDate.getTime();

        resObj.log = resObj.log.filter(session => {
          let sessionDate = new Date(session.date).getTime();

          return sessionDate >= fromDate && sessionDate <= toDate;
        });
      }

      if (req.query.limit) {
        resObj.log = resObj.log.slice(0, req.query.limit);
      }

      resObj = resObj.toJSON();
      resObj["count"] = result.log.length;
      res.json(resObj);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
