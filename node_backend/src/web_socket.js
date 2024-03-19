import { WebSocketServer } from "ws";
import fs from "fs-extra";
import { dataFolderName } from "./constants.js";
import path from "path";
import { v4 as uuidv4 } from 'uuid';

let sessionId = null;

const startWebSocketServer = () => {
  const wss = new WebSocketServer({ port: 3008 });
  wss.on("connection", (ws) => {
    console.log("WebSocket connection established.");
    // Handle incoming messages
    ws.on('message', (message) => {
      const payload = JSON.parse(message.toString());

      if (payload.type === "session Id Change") {
        if(payload.data === "null" || payload.data === "-1"){
          payload.sessionId = null;
          sessionId = null;
          console.log("Session stopped.")
        }
        else{
          payload.sessionId = payload.data;
          sessionId = payload.data;
          console.log(`New Session started. New sessionId : ${payload.data}.`)
        }
        console.log(payload);
      }
      else if(payload.type === "rrweb events"){
        //Check if payload has sessionId or not
        if(payload.sessionId === undefined && sessionId === null){
          const newSessionId = uuidv4(); 
          payload.sessionId = newSessionId; // Assigning SessionId to payload
          sessionId = newSessionId;
          console.log(`New Session started. Assigned sessionId : ${sessionId}`);
        }
        else if(payload.sessionId === undefined && sessionId !== null){
          payload.sessionId = sessionId; // Assigning SessionId to payload
          console.log(`Assigned sessionId : ${sessionId}`);
        }
        else{
          payload.sessionId = sessionId; // Assigning SessionId to payload
          console.log(`Assigned sessionId : ${sessionId}`);
        }
        processPayload(payload);
      }
    });
  });
};


let lastUrl = null;
let id = 0;

const processPayload = (payload) => {
  const { type, url, data } = payload;
  console.log("*".repeat(80));
  console.log({ type, url, payload });

  if (type !== "rrweb events") {
    return;
  }
  const jsonData = JSON.parse(data);
  console.log("Id : ", id);
  let dataFilePath;
  if (url !== lastUrl) {   
    id++;
    dataFilePath = path.join(dataFolderName, id.toString());
    fs.writeJsonSync(dataFilePath, jsonData); // This would empty the files if there's already content   
  } 
  else {
    // Simply append to the same file;  No change
    dataFilePath = path.join(dataFolderName, id.toString());
    fs.writeJsonSync(dataFilePath, jsonData, { flag: "a" });
  }
  lastUrl = url;
};

export { startWebSocketServer };
