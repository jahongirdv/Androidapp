import { useState } from 'react';

import MessageBubble from '../components/MessageBubble';
import { useApp } from '../context/AppContext';
import { getRandomColor } from '@sarawebs/sb-utils';
import { MessageCircle } from 'lucide-react';
import NewMessage from '../components/NewMessage';
import { useMessages } from '../context/MessageContext';

import { Button } from 'flowbite-react';

export default function Home() {
  const { messages, removeMessage, loading } = useMessages();

  const { appName } = useApp();
  const [open, setModal] = useState(false);

  const handleModalClose = (refetch) => {
    window.history.replaceState(null, '', '/');
    setModal(false);
  };
  const handelDelete = (id) =>
    setData((prev) => prev.filter((msg) => msg.id !== id));
  const onMessageUpdate = ({ text, name, id }) => {
    setData((prev) =>
      prev.map((msg) => {
        if (msg.id == id)
          return {
            ...msg,
            text,
            name,
          };
        else return msg;
      })
    );
  };
  return (
    <div className="home">
      <h1 className="text-4xl font-bold mb-4 text-primary">
        Welcome to the {appName}
      </h1>

      <section className="msg-list">
        <div className="flex flex-col  gap-4 mx-auto max-w-100">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              avatarColor={getRandomColor()}
              onSave={onMessageUpdate}
            />
          ))}
        </div>

        <ul></ul>
      </section>
      <section className="mt-5 dark:text-white">
        <h2>
          Visit{' '}
          <a
            aria-label="Git Repo"
            href="https://github.com/mdahamshi/top-basic-msg-full"
          >
            Git Repo
          </a>{' '}
          for more information
        </h2>
      </section>
      <Button
        className="fixed bottom-4 p-0 right-4 z-50 shadow-lg bg-primary text-white hover:bg-primary/70 w-14 h-14 rounded-full flex items-center justify-center"
        onClick={() => {
          if (location.pathname !== '/new') {
            window.history.replaceState(null, '', '/new');
            setModal(true);
          }
        }}
      >
        <MessageCircle size={24} strokeWidth={3}></MessageCircle>
      </Button>
      <NewMessage open={open} onClose={handleModalClose} />
    </div>
  );
}
