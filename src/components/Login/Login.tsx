import { useState } from 'react';
import './Login.css'

interface LoginProps  {
    onLogin: (id:string, token:string) => void;
}
function Login ({onLogin}:LoginProps) {
    // состояния для хранения данных из полей ввода
    const [idInstance, setIdInstance] = useState<string>('');
    const [tokentInstance, setTokenInstance] = useState<string>('');

    const handleOnSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const cleanId = idInstance.trim();
        const cleanToken = tokentInstance.trim();

        if (!/^\d+$/.test(cleanId)) {
            alert('idInstance должен состоять только из цифр');
            return;
        }

        if (!/^[a-f0-9]{50}$/.test(cleanToken)) {
            alert('токен должен состоять из 50 символов');
            return;
        }

        onLogin(cleanId, cleanToken);
    };


    return (
        <div className="login-overlay">
            <form className="login-form" onSubmit={handleOnSubmit}>
                <h3 className='form-header'>Введите свои учетные данные из системы </h3>

                <div className="input-group">
                    <label htmlFor="idInstance" className='input-label'>idInstance</label>
                    <input 
                        value={idInstance}
                        id="idInstance"
                        onChange={e => setIdInstance(e.target.value)}
                        type="text" 
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="tokenInstance" className='input-label'>apiTokenInstance</label>
                    <input 
                        value={tokentInstance}
                        id="tokenInstance"
                        onChange={e => setTokenInstance(e.target.value)}
                        type="password" 
                        required
                    />
                </div>

                <button 
                    type='submit' 
                    className='login-btn'
                >
                    Войти
                </button>
            </form>
        </div>
        
    )
}

export default Login;