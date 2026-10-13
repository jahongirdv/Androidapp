import React, { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Trash, SquarePen } from 'lucide-react';
import { Button } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import MessageEdit from './MessageEdit';
import { useMessages } from '../context/MessageContext';

const getInitials = (name) => name.charAt(0).toUpperCase();

const MessageBubble = ({ msg, avatarColor = '#6C63FF', onSave }) => {
  const [edit, setEdit] = useState(false);
  const { removeMessage, editMessage } = useMessages();

  const navigate = useNavigate();
  const { name, text, added, id, editable } = { ...msg };
  const messageDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this message?'
    );
    if (!confirmed) return;

    return removeMessage(id);
  };
  if (edit)
    return <MessageEdit msg={msg} onCancelSave={() => setEdit(false)} />;
  return (
    <div className="flex flex-col p-4   rounded-md shadow-md  dark:bg-primaryDark  justify-between gap-3 py-2">
      <div>
        <div className="flex gap-3 justify-center">
          <span className="ml-2 text-xs text-gray-400">
            {format(new Date(added), 'PPP, p')}
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(name)}
        </div>

        {/* Message content */}
        <div>
          {/* Name + added */}
          <div className="dark:text-white text-sm font-semibold">{name}</div>

          {/* Bubble */}
          <div className="bg-primary break-words  text-white  px-4 py-2 rounded-xl mt-1 inline-block max-w-xs">
            {text}
          </div>

          {/* Status */}
          <div className="text-xs text-gray-500 mt-1">Delivered</div>
        </div>
      </div>
      {editable && (
        <div className="flex gap-4 justify-end">
          <Button color="yellow" onClick={() => setEdit(true)}>
            <SquarePen className="dark:stroke-white" />
          </Button>
          <Button color="red" onClick={() => messageDelete(id)}>
            <Trash className="dark:stroke-white" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
