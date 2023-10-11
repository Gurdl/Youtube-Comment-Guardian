import React, { useEffect } from "react";
import "./Result.css";
import { useState } from "react";
import YouTube from 'react-youtube';
function Results(props) {
  // Define the URL you want to fetch data from
  const opts = {
    height: '560',
    width: '1040',
  };

  return (
    <div className="results">
      <YouTube className="video" videoId={props.videoId} opts={opts} />
      <div className="tables">
        <header className="heading">
          <div className="Name_H">Name</div>
          <div className="Comments_H">Comments</div>
          <div className="Response_H"> Need Response</div>
        </header>
        <table>
          <tbody>
            {props.comments.map((comment, index) => (
              <tr key={index}>
                {/* <td><img src={}></img></td> */}
                <td className="Name_H">{comment.commenter}</td>
                <td>{comment.comment}</td>
                <td className="Response_H">{comment.respond ? 'YES' : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Results;
