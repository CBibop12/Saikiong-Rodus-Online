/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

const FortuneWheel = ({ map1, map2, winnerMap, onAnimationComplete }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentAngle, setCurrentAngle] = useState(0);
    const [timeLeft, setTimeLeft] = useState(6);

    useEffect(() => {
        // Запуск анимации
        setIsSpinning(true);

        // Таймер обратного отсчета
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Анимация вращения
        const spinInterval = setInterval(() => {
            setCurrentAngle(prev => (prev + 30) % 360);
        }, 100);

        // Остановка анимации через 6 секунд
        const stopTimer = setTimeout(() => {
            clearInterval(spinInterval);
            setIsSpinning(false);

            // Определяем финальный угол в зависимости от победителя
            const finalAngle = winnerMap === map1.name ? 0 : 180;
            setCurrentAngle(finalAngle);

            // Ждем еще секунду перед завершением
            setTimeout(() => {
                onAnimationComplete();
            }, 1000);
        }, 6000);

        return () => {
            clearInterval(timer);
            clearInterval(spinInterval);
            clearTimeout(stopTimer);
        };
    }, [map1, map2, winnerMap, onAnimationComplete]);

    return (
        <div className="fortune-wheel-overlay">
            <div className="fortune-wheel-container">
                <div className="fortune-wheel-header">
                    <h2>Выбор карты...</h2>
                    <p>Оба игрока выбрали разные карты. Определяем победителя случайным образом!</p>
                    <div className="countdown-timer">{timeLeft}</div>
                </div>

                <div className="wheel-container">
                    <div className="wheel-pointer"></div>
                    <div
                        className={`wheel ${isSpinning ? 'spinning' : ''}`}
                        style={{ transform: `rotate(${currentAngle}deg)` }}
                    >
                        <div className="wheel-section wheel-section-1">
                            <div className="wheel-section-content">
                                <img
                                    src={`/assets/images/${map1.image}`}
                                    alt={map1.userName}
                                    className="wheel-map-image"
                                />
                                <div className="wheel-map-name">{map1.userName}</div>
                            </div>
                        </div>
                        <div className="wheel-section wheel-section-2">
                            <div className="wheel-section-content">
                                <img
                                    src={`/assets/images/${map2.image}`}
                                    alt={map2.userName}
                                    className="wheel-map-image"
                                />
                                <div className="wheel-map-name">{map2.userName}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="wheel-maps-info">
                    <div className="competing-map">
                        <h4>Вариант 1</h4>
                        <div className="map-info">
                            <img src={`/assets/images/${map1.image}`} alt={map1.userName} />
                            <div>
                                <p className="map-name">{map1.userName}</p>
                                <p className="map-details">
                                    {map1.size[0]}x{map1.size[1]} • {map1.creeps ? 'С крипами' : 'Без крипов'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="vs-divider">VS</div>

                    <div className="competing-map">
                        <h4>Вариант 2</h4>
                        <div className="map-info">
                            <img src={`/assets/images/${map2.image}`} alt={map2.userName} />
                            <div>
                                <p className="map-name">{map2.userName}</p>
                                <p className="map-details">
                                    {map2.size[0]}x{map2.size[1]} • {map2.creeps ? 'С крипами' : 'Без крипов'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FortuneWheel; 