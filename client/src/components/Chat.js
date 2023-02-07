import React, { useEffect, useState } from "react";
import { ACTION_TYPES } from "../constants";
import { SendIcon } from '../sendIcon.js';

const Chat = (props) => {
  const [text, setText] = useState('');
  const [chatHistory, setChatHistory] = useState(props.chat);
  useEffect(() => {
    if (chatHistory.length !== props.chat.length) {
      setChatHistory(props.chat);
    }
    const msgDiv = document.getElementById("messages");
    if(msgDiv) {
      msgDiv.scrollTop = msgDiv.scrollHeight;
    }
  }, [props.chat, props.chat.length, chatHistory]);
  
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
    <div className="page-content page-container" id="page-content">
      <div className="padding">
        <div className="row container d-flex justify-content-center">
          <div>
            <div className="box box-warning direct-chat direct-chat-warning">
              <div className="box-header with-border">
                <h3 className="box-title">Chat Messages</h3>
              </div>
              <div className="box-body">
                <div className="direct-chat-messages" id="messages">
                  {chatHistory.length ? chatHistory.map((chat, i) => (
                    <div key={i} className={`direct-chat-msg ${chat.userName !== props.name ? '' : 'right'}`}>
                      <div className="direct-chat-info clearfix">
                        <span className={`direct-chat-name float-${chat.userName !== props.name ? 'start' : 'end'}`}>{chat.userName === props.name ? 'You' : chat.userName}</span>
                        <span className={`direct-chat-timestamp float-${chat.userName !== props.name ? 'end' : 'start'}`}>{chat.timestamp}</span>
                      </div>
                      <div className="direct-chat-text">
                        {chat.message}
                      </div>
                    </div>
                  )) : <div>No messages to display</div> }
                </div>
              </div>
              <div className="box-footer">
                <div className="input-group">
                  <input
                    type="text"
                    value={text}
                    placeholder="Type Message ..."
                    className="form-control"
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        sendNewMessage();
                      }
                    }}
                  />
                  <span className="input-group-btn">
                    <button
                      onClick={sendNewMessage}
                      type="button"
                      className="btn btn-warning btn-flat"
                    >
                      <SendIcon />
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;