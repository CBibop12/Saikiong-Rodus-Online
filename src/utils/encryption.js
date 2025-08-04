import CryptoJS from 'crypto-js';

// Получаем ключ шифрования, сохранённый в сессии или по умолчанию
const getKey = () => sessionStorage.getItem('srRoomKey') || 'default_room_key';

export const encryptMessage = (plainText) => {
    const key = getKey();
    return CryptoJS.AES.encrypt(plainText, key).toString();
};

export const decryptMessage = (cipherText) => {
    const key = getKey();
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
        console.error('Ошибка дешифровки сообщения', err);
        return '';
    }
}; 