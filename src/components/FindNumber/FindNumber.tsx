import { useState } from "react";
import "./FindNumber.css"

interface FindNumberProps {
    onFind: (phoneNumber: string) => void
    onClose: () => void
}

function FindNumber({ onFind, onClose }: FindNumberProps) {
    const [phoneNumber, setPhoneNumber] = useState<string>("");


    // 
    const handleFindNumber = (e: React.FormEvent) => {
        e.preventDefault();

        let cleanPhone = phoneNumber.replace(/[\s+\-()]/g, "");

        if (cleanPhone.startsWith("8") && cleanPhone.length === 11) {
            cleanPhone = "7" + cleanPhone.slice(1);
        }

        if (/^\d{10,15}$/.test(cleanPhone)) {
            onFind(cleanPhone);
            setPhoneNumber("");
        } else {
            alert("введите корректный номер телефона, например 79991234567");
        }
    }

    return (
        <div className="number-overlay" onClick={onClose}>
            <form
                className="number-content"
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleFindNumber}
            >
                <h2>Введите номер телефона</h2>
                <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoFocus
                    required
                />
                <button type="submit">Найти</button>
            </form>
        </div>
    )
}

export default FindNumber;