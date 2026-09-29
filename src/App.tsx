import { Group, Panel, Separator } from "react-resizable-panels";
import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login/Login'
import ChatWindow from './components/ChatWindow/ChatWindow'
import Sidebar from './components/Sidebar/Sidebar'

// url апи
const API_URL = 'https://3100.api.green-api.com';

function App() {
  // состояние для хранения данных для входа
  const [data, setData] = useState<{ id: string, token: string, url: string } | null>(() => {
    const savedId = localStorage.getItem('id_instance');
    const savedToken = localStorage.getItem('token_instance');

    if (savedId && savedToken) {
      return { id: savedId, token: savedToken, url: API_URL };
    }
    return null;
  });

  // состояние для получения сохраненных чатов
  const [chats, setChats] = useState<{ chatId: string, title: string }[]>(() => {
      const saved = localStorage.getItem('chats');
      return saved ? JSON.parse(saved) : [];
  });

  // сохранение чатов в local storage
  useEffect(() => {
      localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  // состояние активного чата
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const handleLogin = (id: string, token: string) => {
    localStorage.setItem('id_instance', id);
    localStorage.setItem('token_instance', token);
    setData({ id, token, url: API_URL });
  }

  // функция обновления имени контакта в списке чатов
  const updateChatName = (chatId: string, name?: string) => {
      if (!name) return;
      setChats(prev =>
          prev.map(chat =>
              chat.chatId === chatId && chat.title !== name ? { ...chat, title: name } : chat
          )
      );
  };
  // создание чата
  const handleNewChat = async (phoneNumber: string) => {
    if (!data) return;

    try {
      const res = await fetch(`${data.url}/waInstance${data.id}/checkAccount/${data.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: Number(phoneNumber) })
      });


      const result = await res.json();
      
      if (!result.exist) {
          alert('ошибка поиска номера телефона');
          return;
      }
      const chatId = result.chatId;

      if (!chats.some(chat => chat.chatId === chatId)) {
        setChats([...chats, { chatId, title: phoneNumber }]);
      }

      setActiveChatId(chatId);

    } catch (error) {
      console.error("ошибка создания чата: ", error);
    
    }
  }

  if (!data) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className='main-content'>

      <Group orientation="horizontal">
        <Panel defaultSize="30" minSize="10" maxSize="50">
          <Sidebar
            chatsList={chats}
            activeChat={activeChatId}
            createChat={handleNewChat}
            onSelectedChat={setActiveChatId}
          />
        </Panel>
        <Separator className="sidebar-resizer-line" />
        <Panel>
          <ChatWindow
            activeChat={chats.find(c => c.chatId === activeChatId) ?? null}
            data={data}
            onContactName={updateChatName}
          />
        </Panel>
        
      </Group>
      
    </div>
  )
}

export default App