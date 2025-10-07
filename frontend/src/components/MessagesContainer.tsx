import type { MessageType } from "../types/message.type";
import Message from "./Message";

type MessagesContainerProps = {
  messages: MessageType[];
}

const MessagesContainer = ({ messages }: MessagesContainerProps) => {
  return (
    <div className="width-full height-[50vh] border border-black">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
        />
      ))}
    </div>
  )
}

export default MessagesContainer