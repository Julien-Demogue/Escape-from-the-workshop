import type { MessageType } from "../types/message.type";

type MessageProps = {
  message: MessageType;
}
const Message = ({ message }: MessageProps) => {
  return (
    <div style={{ backgroundColor: message.senderColor+'2'}}>
      <p className="font-bold" style={{ color: message.senderColor }}>{message.senderName}</p>
      <p>{message.content}</p>
    </div>
  )
}

export default Message