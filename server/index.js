const { google } = require("googleapis");
const express = require("express");
const cors = require("cors");
const { config } = require("dotenv");
const fs = require("fs");
const { insertCommentsToDB } = require("./db");
config();

const app = express();
const port = 3050;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());

// This youtube will be used to get all the api data:
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API,
});

// This const-variables holds all the comments:
let comments;
app.post("/id", async (req, res) => {
  try {
    const { id } = req.body;
    comments = await new Promise((resolve, reject) => {
      youtube.commentThreads.list(
        {
          part: "snippet",
          videoId: id,
        },
        (err, data) => {
          if (err) throw err;
          resolve(data.data.items);
        }
      );
    });
    console.log("Comments from youTube API", comments);
    // Add all these comments to database as well:
    try {
      const insertedComments = await insertCommentsToDB(comments);
      console.log("Comments inserted successfully:");
    } catch (error) {
      console.error("Error inserting comments:", error);
    }
    res.json(comments);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get the thumnails:
app.post("/thumbnails", (req, res) => {
  const videoId = 'XwGNhppX4as';
  const apiKey = process.env.YOUTUBE_API;

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

  axios.get(url)
    .then(response => 
      {
      console.log(response.data);
      res.send(response.data);
    })
    .catch(error => {
      console.error(error);
    });
})

app.listen(port, () => {
  console.log(`app is working on ${port}`);
});
