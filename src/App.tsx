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

  // создание чата
  const handleNewChat = async (phoneNumber: string) => {
    if (!data) return;

    try {
      const res = await fetch(`${data.url}/waInstance${data.id}/checkAccount/${data.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: Number(phoneNumber) })
      });

      const text = await res.text();
      console.log('checkAccount:', res.status, text);

      if (!res.ok) {
          alert(`ошибка проверки номера (${res.status}): ${text}`);
          return;
      }

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
      <Sidebar
        chatsList={chats}
        activeChat={activeChatId}
        createChat={handleNewChat}
        onSelectedChat={setActiveChatId}
      />
      <ChatWindow
        activeChat={chats.find(c => c.chatId === activeChatId) ?? null}
        data={data}
      />
    </div>
  )
}

export default App