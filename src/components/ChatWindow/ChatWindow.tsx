import { useState, useEffect, useRef } from "react";
import "./ChatWindow.css";

// типы данных для сообщения
interface Message {
    id: string;
    text: string;
    type: 'incoming' | 'outgoing';
}

interface ChatWindowProps {
    activeChat: { chatId: string, title: string } | null;
    data: { id: string, token: string, url: string };
}

function ChatWindow({ activeChat, data }: ChatWindowProps) {
    const [textToSend, setTextToSend] = useState<string>('');
    // состояние для хранения истории чатов 
    const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>(() => {
        const saved = localStorage.getItem('chatHistory');
        return saved ? JSON.parse(saved) : {};
    });

    // сохранение истории чатов
    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }, [chatHistory]);

    const currentMessages = activeChat ? (chatHistory[activeChat.chatId] || []) : [];
    const messageAreaRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const area = messageAreaRef.current;
        if (area) {
            area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
        }
    }, [currentMessages.length, activeChat]);
    

    // добавить сообщение в историю чата
    const addMessage = (chatId: string, message: Message) => {
        setChatHistory(prev => {
            const list = prev[chatId] || [];
            if (list.some(m => m.id === message.id)) return prev;
            return { ...prev, [chatId]: [...list, message] };
        });
    };

    useEffect(() => {
        setTextToSend('');
    }, [activeChat?.chatId])

    // функция отправки сообщения 
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChat || !textToSend.trim()) return;
        const message = textToSend.trim();
        
        try {
            const res = await fetch(`${data.url}/waInstance${data.id}/sendMessage/${data.token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: activeChat.chatId, message })
            });

            if (!res.ok) {
                console.log('ошибка отправки сообщения');
                return;
            }
            const result = await res.json();
            addMessage(activeChat.chatId, { id: result.idMessage, text: message, type: 'outgoing' });
            setTextToSend('');
        } catch (error) {
            console.error('при отправлке ссобщения произошла ошибка:', error);
        }
    };
    

    // получение входящего сообщения
    useEffect(() => {
        const controller = new AbortController();

        const receiveMessages = async () => {
            while (!controller.signal.aborted) {
                try {
                    const res = await fetch(`${data.url}/waInstance${data.id}/receiveNotification/${data.token}`,
                        { signal: controller.signal }
                    );
                    if (!res.ok) throw new Error('receiveNotification ' + res.status);

                    const responseText = await res.text();
                    if (!responseText) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }

                    const notification = JSON.parse(responseText);

                    try {
                        const body = notification.body;
                        const webhookType = body.typeWebhook;
                        if (webhookType === 'incomingMessageReceived' || webhookType === 'outgoingMessageReceived') {
                            const chatId = body.senderData.chatId;
                            const text = body.messageData?.textMessageData?.textMessage;
                            if (text) {
                                addMessage(chatId, {
                                    id: body.idMessage,
                                    text,
                                    type: webhookType === 'incomingMessageReceived' ? 'incoming' : 'outgoing'
                                });
                            }
                        }
                    } finally {
                        await fetch(`${data.url}/waInstance${data.id}/deleteNotification/${data.token}/${notification.receiptId}`,
                            { method: 'DELETE' }
                        );
                    }
                } catch (error) {
                    if (controller.signal.aborted) return;
                    console.error(error);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        };

        receiveMessages();
        return () => controller.abort(); 
    }, [data]);


    return (
        <div className="chatWindow">
            {activeChat ? (
                <>
                    <div className="chatWindow__header">
                        <h3>{activeChat.title}</h3>
                    </div>

                    <div className="chatWindow-message-area" ref={messageAreaRef}>
                        {currentMessages.map((msg) => (
                            <div key={msg.id} className={`message ${msg.type}`}>
                                <p className="message-text">{msg.text}</p>
                            </div>
                        ))}
                    </div>

                    <form className="chatWindow-keyboard" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Сообщение"
                            value={textToSend}
                            onChange={(e) => setTextToSend(e.target.value)}
                            required
                        />
                        {textToSend && (
                            <button type="submit">Отправить</button>
                        )}
                    </form>
                </>
            ) : (
                <div className="chatWindow-empty">
                    <p>Выберите чат слева или добавьте новый номер телефона, чтобы начать переписку</p>
                </div>
            )}
        </div>
    );
}

export default ChatWindow;