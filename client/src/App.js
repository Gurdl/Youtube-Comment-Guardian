import "./App.css";
import getVideoId from "get-video-id";
import { useState } from "react";
import Results from "./Components/Results";
function App() {
  const [videoUrl, SetVideoUrl] = useState("");
  const [id, setId] = useState("j3xbO5zPj4g");
  const [comments, setComments] = useState([]);
  const [youTubeData,setYoutubeData]=useState([]);
  function handleSubmit(e) {
    e.preventDefault();
    const { id } = getVideoId(videoUrl);
    setId(id);
    console.log(id);
    SetVideoUrl("");
    //Send the id to api:--------------------------------------------------------------------
    const apiUrl = "http://localhost:3050/id";
    const idToSend = { id: id }; // Replace 'yourIdValue' with the actual ID you want to send
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(idToSend),
    })
      .then((response) => {
        // Check if the response status is OK (200)
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        // Parse the response body as JSON
        return response.json();
      })
      .then((data) => {
        // Handle the data from the response
        console.log("Post reuqest")
        console.log(data);
        setYoutubeData(data);
      })
      .catch((error) => {
        // Handle any errors that occurred during the fetch
        console.error("Fetch error:", error);
      });
    // Get the comments from the table --------------------------------------------
    const apiUrl2 = "http://localhost:3080/database";
    // Use the fetch function to make a GET request
    fetch(apiUrl2)
      .then((response) => {
        // Check if the response status is OK (200)
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        // Parse the response body as JSON
        return response.json();
      })
      .then((data) => {
        // Handle the data from the response
        console.log("get reuqest")
        console.log(data);
        setComments(data);
      })
      .catch((error) => {
        // Handle any errors that occurred during the fetch
        console.error("Fetch error:", error);
      });
  }
  return (
    <div className="App">
      <div className="Topbar">
        <div className="Icon">
          <i className="bi bi-youtube"></i>
          <label>YouTube</label>
        </div>
        <div className="searchBar">
          <input></input>
          <i className="bi bi-search"></i>
        </div>
        <div className="TopBar-Right">
          <i className="bi bi-bell"></i>
          <i className="bi bi-person-circle"></i>
          <i className="bi bi-camera-reels-fill"></i>
        </div>
      </div>
      <div className="Header">
        <h1>Update Your You Tube Comments</h1>
      </div>
      <main className="links_Content">
        <div className="Video_Links">
          <label>Video Link :</label>
          <input
            className="Video-Input-Holder"
            value={videoUrl}
            onChange={(e) => {
              SetVideoUrl(e.target.value);
            }}
            id="video_Link"
            placeholder="https://www.youtube.com/"
          ></input>
          <button className="Submit" onClick={handleSubmit}>
            Submit
          </button>
        </div>
        {/* <div className="id">
          <h3>Video Id: {id}</h3>
        </div> */}
      </main>
      {console.log(videoUrl)};
      <div>
        <Results videoId={id} youTubeData={youTubeData} comments={comments}></Results>
      </div>
    </div>
  );
}

export default App;
