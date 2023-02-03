import React, { useEffect, useState } from "react";
import { ACTION_TYPES } from "../constants";

const Chat = (props) => {
  const [text, setText] = useState('');
  const [chatHistory, setChatHistory] = useState(props.chat);
  useEffect(() => {
    setChatHistory(props.chat);
  }, [props.chat, props.chat.length]);
  
  const sendNewMessage = () => {
    const data = {
      action: ACTION_TYPES.SEND_MESSAGE,
      message: text,
      userName: props.name,
    };
    props.sendMessage(data);
    setText('');
  };
  return (
    <div className="chat">
      <div className="chatHistory">
        {chatHistory.length ? chatHistory.map((chat, i) => (
          <div key={i}>
            <b>{chat.userName}</b> : {chat.message}
            <span className="timestamp">({chat.timestamp})</span>
          </div>
        )) : <div>No messages to display</div>}
      </div>
      <div className="submitMessage">
        <input
          type='text'
          className="chatInput"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendNewMessage();
            }
          }}
        />
        <button
          type='submit'
          onClick={sendNewMessage}
        >Send</button>
      </div>
    </div>
  );
};

export default Chat;