const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GoogleImages = require("google-images");
const API_KEY = process.env.API_KEY;
const CSE_ID = process.env.CSE_ID;
const client = new GoogleImages(CSE_ID, API_KEY);

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.once("open", () => {
  console.log("connection made to db");
});
mongoose.connection.on("error", function() {
  console.log("error occured during connection");
});

let layerSchema = Schema({
  term: String,
  when: String
});

let layer = mongoose.model("layer", layerSchema);

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/api/imagesearch/:query", (req, res) => {
  let offset = 1;
  if (req.query.offset) {
    offset = +req.query.offset;
  }

  client.search(req.params.query, { page: offset }).then(images => {
    let searchedData = [];

    images.forEach(val => {
      searchedData.push({
        url: val["url"],
        snippet: val["description"],
        thumbnail: val["thumbnail"]["url"],
        context: val["parentPage"]
      });
    });
    res.end(JSON.stringify(searchedData));
  });

  layer({ term: req.params.query, when: Date.now() }).save(() => {
    console.log("data saved");
  });
});

app.get("/api/latest/imagesearch", (req, res) => {
  layer.find({}, (err, data) => {
    let cleanedData = [];
    data.forEach(elem => {
      cleanedData.push({
        term: elem["term"],
        when: elem["when"]
      });
    });
    res.end(JSON.stringify(cleanedData));
  });
});

let listener = app.listen(process.env.PORT, () => {
  console.log("listening at port 3000");
});
