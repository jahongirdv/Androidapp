import React, { createContext, useContext, useEffect, useState } from 'react';
import * as messagesApi from '../api/messages';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await messagesApi.fetchMessages();
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async (messageData) => {
    try {
      const res = await messagesApi.createMessage(messageData);
      setMessages((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error('Failed to create message', err);
    }
  };

  const removeMessage = async (id) => {
    try {
      await messagesApi.deleteMessage(id);
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const editMessage = async (id, updatedData) => {
    try {
      const res = await messagesApi.updateMessage(id, updatedData);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, ...updatedData } : msg))
      );
    } catch (err) {
      console.error('Failed to update message', err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <MessageContext.Provider
      value={{
        messages,
        loading,
        reload: loadMessages,
        addMessage,
        removeMessage,
        editMessage,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
