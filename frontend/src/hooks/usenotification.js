// hooks/useNotification.js
import { useState } from 'react';

export function useNotification() {
    const [notification, setNotification] = useState({
        message: "",
        type: "",
        visible: false,
    });

    const showNotification = (message, type) => {
        setNotification({ message, type, visible: true });
        setTimeout(() => {
            setNotification({ ...notification, visible: false });
        }, 3000);
    };

    return { notification, showNotification };
}
