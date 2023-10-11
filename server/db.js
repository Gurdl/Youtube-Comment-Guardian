const mysql = require("mysql2/promise");
const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { config } = require("dotenv");
config();

const app = express();
const port = 3080;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/database", async (req, res) => {
  try {
    await createConnection();
    // Call the readN function to retrieve data from the database
    const data = await readN({ singleStoreConnection });
    // Send the retrieved data as a response
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Modify the connection details to match the details specified while
//deploying the SingleStore workspace:
const HOST =
  "svc-150d24c5-b3ee-4f7d-a3d1-f91b7b5caa22-dml.aws-oregon-3.svc.singlestore.com";
const USER = "admin";
const PASSWORD = "Singh1234";
const DATABASE = "Youtube_Comments";

//connection variable:
let singleStoreConnection;

// Create a connection function
async function createConnection() {
  singleStoreConnection = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
  });
  console.log("You have successfully connected to SingleStore.");
}

// Insert the data :
async function create({ singleStoreConnection, comment }) {
  if (!singleStoreConnection) {
    throw new Error("Connection is not established.");
  }
  const [results] = await singleStoreConnection.execute(
    `INSERT INTO  comments (commentid, commenter , comment , gpt , flag , respond) 
        VALUES (?,?,?,?,?,?)`,
    [
      comment.commentid,
      comment.commenter,
      comment.comment,
      comment.gpt,
      comment.flag,
      comment.respond,
    ]
  );
  return results.insertId;
}

// This function reads and select the whole table rows the table:
async function readN({ singleStoreConnection }) {
  const [rows] = await singleStoreConnection.execute("SELECT * from comments");
  return rows;
}

// // Delete all data from the table
async function deleteAllData() {
  if (!singleStoreConnection) {
    throw new Error("Connection is not established.");
  }
  // Use a DELETE statement without specifying conditions to delete all rows
  await singleStoreConnection.execute("DELETE FROM comments");
  console.log("All data deleted from the 'comments' table.");
}
// This function is used to remove the emoji
function removeEmojis(text) {
  // Replace emojis with an empty string
  return text.replace(/[\u{1F600}-\u{1F64F}]/gu, "");
}
function removeSpecialCharacters(text) {
  // Define a regular expression that matches any character that is not a letter or a number
  const regex = /[^a-zA-Z0-9\s]/g;
  // Use the replace() method with the regular expression to remove special characters
  const cleanedText = text.replace(regex, "");
  return cleanedText;
}
function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text; // No need to truncate if the text is already within the limit.
  } else {
    return text.slice(0, maxLength); // Truncate the text to the specified maxLength.
  }
}
function filterNames(comment) {
  const MAX_COMMENT_LENGTH = 500;
  const originalComment = comment;
  const textWithoutEmojis = removeEmojis(originalComment);
  const filteredData = removeSpecialCharacters(textWithoutEmojis);
  const finalData = truncateText(filteredData, MAX_COMMENT_LENGTH);
  return finalData;
}
const insertCommentsToDB = async (comments) => {
  const MAX_COMMENT_LENGTH = 500;
  try {
    await createConnection();
    deleteAllData();
    for (let i = 0; i < comments.length; i++) {
      // console.log(comments[i].snippet.topLevelComment.snippet.textOriginal);
      const originalComment =
        comments[i].snippet.topLevelComment.snippet.textOriginal;
      const textWithoutEmojis = removeEmojis(originalComment);
      const filteredData = removeSpecialCharacters(textWithoutEmojis);
      const finalData = truncateText(filteredData, MAX_COMMENT_LENGTH);
      const id = await create({
        singleStoreConnection,
        comment: {
          commentid: comments[i].id,
          commenter: filterNames(
            comments[i].snippet.topLevelComment.snippet.authorDisplayName
          ),
          comment: finalData,
          gpt: "",
          flag: 0,
          respond: 0,
        },
      });
      console.log(`Inserted row id is: ${id}`);
    }
    // Now update the databse as requirements with help of open-ai
    Update_table_by_Chat_Gpt();
  } catch (err) {
    console.error("Error inserting comments:", err);
  }
};

//Update the table with help of chat-Gpt:
async function Update_table_by_Chat_Gpt() {
  createConnection();
  try {
    await createConnection();
    const comments = await readN({ singleStoreConnection });

    // Assign tasks to open ai to reply for comments
    for (let i = 0; i < comments.length; i++) {
      const completion = await openai.completions.create({
        model: "text-davinci-003",
        prompt:
          `The Following AI tool helps youtubers indentify ifa a comment can
            should be replied to or not. Questions and or asking for advice are good examples of 
            when a reply is needed\n\n` +
          // Context Example 1
          `User:John Smith\n` +
          `Comment:That was a great video.thanks !\n` +
          `Should Reply:No \n\n` +
          // Context Example 1
          `User:Sue Mary\n` +
          `Comment:I'am stuck on step four, How do I do that ?\n` +
          `Should Reply:Yes \n\n` +
          // Actual Use Case:
          `User:${comments[0].commenter}\n` +
          `Comment:${comments[i].comment}\n` +
          `Should Reply:`,
        stop: ["\n", "User:", "Commen:t", "Should Reply"],
        max_tokens: 7,
        temperature: 0,
      });
      console.log(completion.choices[0].text);
      if (completion.choices[0].text.trim() == "Yes") {
        console.log(comments[i].comment);
        await singleStoreConnection.execute(
          `UPDATE comments SET respond = 1 WHERE id = ${comments[i].id}`
        );
        console.log("data base is updated");
      }
    }
  } catch (err) {
    console.log(err);
  }
}
module.exports = {
  insertCommentsToDB,
};
app.listen(port, () => {
  console.log(`app is working on ${port}`);
});
