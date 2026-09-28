import { useState } from "react"
import "./Sidebar.css"
import plusIcon from "../../assets/plus.svg"
import FindNumber from "../FindNumber/FindNumber"

interface SidebarProps {
    chatsList: { chatId: string, title: string }[]
    activeChat: string | null
    createChat: (phoneNumber: string) => void
    onSelectedChat: (chatId: string) => void
}

function Sidebar({ chatsList, activeChat, createChat, onSelectedChat }: SidebarProps) {
    // модальное окно создания чата
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    return (
        <aside className="sidebar">
            <div className="sidebar__header">
                <h2>Чаты</h2>
                <button
                    type="button"
                    className="btn-sidebar-newChat"
                    onClick={() => setIsModalOpen(true)}
                >
                    <img src={plusIcon} alt="icon add chat" />
                </button>
            </div>

            <div className="chats-list">
                {chatsList.map((chat) => (
                    <div
                        className={`chat-item ${activeChat === chat.chatId ? 'active' : ''}`}
                        key={chat.chatId}
                        onClick={() => onSelectedChat(chat.chatId)}
                    >
                        <span>{chat.title}</span>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <FindNumber
                    onClose={() => setIsModalOpen(false)}
                    onFind={(phone) => {
                        createChat(phone);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </aside>
    )
}

export default Sidebar;