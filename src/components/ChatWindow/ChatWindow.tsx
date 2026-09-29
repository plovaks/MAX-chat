import { useState, useEffect, useRef, Fragment } from "react";
import "./ChatWindow.css";
import arrowUp from "../../assets/arrowUp.svg"

// типы данных для сообщения
interface Message {
    id: string;
    text: string;
    type: 'incoming' | 'outgoing';
    timestamp:number
}

interface ChatWindowProps {
    activeChat: { chatId: string, title: string } | null;
    data: { id: string, token: string, url: string };
    onContactName: (chatId: string, name?: string) => void;
}

function ChatWindow({ activeChat, data, onContactName }: ChatWindowProps) {
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
    

    // ссылка на textarea ввода сообщений
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const area = textAreaRef.current;
        if (area){
            area.style.height = 'auto'
            area.style.height = Math.min(area.scrollHeight, 228) + 'px';
        }
    }, [textToSend]);

    // функция-обработчик нажатия кнопок 
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

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
            addMessage(activeChat.chatId, { id: result.idMessage, text: message, type: 'outgoing',  timestamp:Math.floor(Date.now() / 1000)});
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
                    if (!notification) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }

                    try {
                        const body = notification.body;
                        // console.log('notification body:', notification.body);
                        const webhookType = body.typeWebhook;
                        if (webhookType === 'incomingMessageReceived' || webhookType === 'outgoingMessageReceived') {
                            const chatId = body.senderData.chatId;
                            const text = body.messageData?.textMessageData?.textMessage;
                            const timeStamp = body.timestamp;
                            const contactName = body.senderData?.senderContactName || body.senderData?.senderName;

                            if (contactName) {
                                onContactName(chatId, contactName);
                            }

                            if (text) {
                                addMessage(chatId, {
                                    id: body.idMessage,
                                    text,
                                    type: webhookType === 'incomingMessageReceived' ? 'incoming' : 'outgoing',
                                    timestamp:timeStamp,
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
    }, [data, onContactName]);


    // функция получения времени отправки/получения сообщения
    function getTime(timestamp:number): string{
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const time = date.toLocaleTimeString('ru-RU').slice(0, 5);
        return time;
    }

    // функция проверки даты сообщений
    function isSameDay(ts1:number, ts2:number):boolean {
        const day1 = new Date(ts1 * 1000);
        const day2 = new Date(ts2 * 1000);

        if (day1.getFullYear() === day2.getFullYear()
            && day1.getMonth() === day2.getMonth()
            && day1.getDate() === day2.getDate()){
            return true;
        }else{
            return false;
        }
    }

    // функция текста разделителя сообщений по датам
    function getDate(ts:number):string{
        if (!ts) return '';
        const date = new Date(ts * 1000);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1)

        if (isSameDay(ts, Math.floor(today.getTime() / 1000))) return 'Сегодня';
        if (isSameDay(ts, Math.floor(yesterday.getTime() / 1000))) return 'Вчера';

        return date.toLocaleDateString('ru-RU', {
            day:'numeric',
            month:'long',
            year:'numeric'
        })
    
    }

    return (
        <div className="chatWindow">
            {activeChat ? (
                <>
                    <div className="chatWindow__header">
                        <h3>{activeChat.title}</h3>
                    </div>

                    <div className="chatWindow-message-area" ref={messageAreaRef}>
                        <div className="chatWindow-message-inner">
                            {currentMessages.map((msg, index) => {
                                const prevMsg = currentMessages[index - 1];
                                const showDate = msg.timestamp && (!prevMsg || !isSameDay(prevMsg.timestamp, msg.timestamp));

                                return (
                                    <Fragment key={msg.id}>
                                        {showDate && (
                                            <div className="date-divider">
                                                <span>{getDate(msg.timestamp)}</span>
                                            </div>
                                        )}
                                        <div className={`message ${msg.type}`}>
                                            <span className="message-text">{msg.text}</span>
                                            <span className="message-time">{getTime(msg.timestamp)}</span>
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <form className="chatWindow-keyboard" onSubmit={handleSendMessage}>
                        <div className="chatWindow-keyboard-inner">
                            <textarea
                                ref={textAreaRef}
                                placeholder="Сообщение"
                                value={textToSend}
                                onChange={(e) => setTextToSend(e.target.value)}
                                required
                                onKeyDown={handleKeyDown}
                                rows={1}
                            />
                            {textToSend && (
                                <button type="submit">
                                    <img src={arrowUp} alt="arrow up" />
                                </button>
                            )}
                        </div>
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