'use client';

import {
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  ThemeProvider,
  createTheme,
  TextInput,
  Textarea,
} from 'flowbite-react';
import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useMessages } from '../context/MessageContext';

const theme = createTheme({
  content: {
    base: 'p-4 flex flex-col justify-center',
  },
});

export default function Component({ open, onClose }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const { addMessage } = useMessages();

  function onCloseModal() {
    setName('');
    setText('');
    onClose(false);
  }
  const handleSend = async (e) => {
    e.preventDefault();
    const body = { name, text };
    addMessage(body);
    setName('');
    setText('');
    onClose(true);
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <Modal
          position="center"
          content="inner"
          show={open}
          theme={theme}
          size="md"
          onClose={onCloseModal}
          popup
        >
          <ModalHeader />
          <ModalBody>
            <form className="space-y-6" onSubmit={handleSend}>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                Send New Message
              </h3>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="name">Your name</Label>
                </div>
                <TextInput
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="text">Your Message</Label>
                </div>
                <Textarea
                  rows={4}
                  id="text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  required
                  placeholder="A brief message to the TOP folks"
                />
              </div>

              <div className="w-full flex justify-end">
                <Button type="submit" className="btn-primary flex gap-4">
                  Send
                  <SendHorizontal />
                </Button>
              </div>
            </form>
          </ModalBody>
        </Modal>
      </ThemeProvider>
    </>
  );
}
