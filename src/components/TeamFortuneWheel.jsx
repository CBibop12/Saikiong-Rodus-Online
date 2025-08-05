/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

const TeamFortuneWheel = ({ redPlayer, bluePlayer, winnerTeam, onAnimationComplete }) => {
    const [currentAngle, setCurrentAngle] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        setIsSpinning(true);

        // Таймер обратного отсчета
        const countdown = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Определяем финальный угол в зависимости от победителя
        // Красный сектор: 180-359 градусов (правая половина)
        // Синий сектор: 0-179 градусов (левая половина)
        const getRandomAngleInRange = (team) => {
            if (team === 'red') {
                return Math.random() * 179 + 180; // 180-359
            } else {
                return Math.random() * 179; // 0-179
            }
        };

        const finalAngle = getRandomAngleInRange(winnerTeam);

        // Добавляем несколько полных оборотов для эффектности
        const totalRotation = finalAngle + 360 * (3 + Math.random() * 2); // 3-5 оборотов

        let startTime = null;
        const duration = 4000; // 4 секунды анимации

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function для естественного замедления
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const angle = totalRotation * easeOut;

            setCurrentAngle(angle);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                // Показываем результат через секунду
                setTimeout(() => {
                    setShowResult(true);
                    // Закрываем через 3 секунды
                    setTimeout(() => {
                        onAnimationComplete();
                    }, 3000);
                }, 1000);
            }
        };

        // Запускаем анимацию
        requestAnimationFrame(animate);

        return () => {
            clearInterval(countdown);
        };
    }, [winnerTeam, onAnimationComplete]);

    return (
        <div className="fortune-wheel-overlay">
            <div className="fortune-wheel-container">
                {!showResult ? (
                    <>
                        <div className="fortune-wheel-header">
                            <h2>Назначение сторон...</h2>
                            <p>Определяем, кто будет защищать красную (левую) и синюю (правую) базы!</p>
                            <div className="countdown-timer">{timeLeft}</div>
                        </div>
                        <div className="wheel-container">
                            <div className="wheel-pointer"></div>
                            <div
                                className="wheel"
                                style={{
                                    transform: `rotate(${currentAngle}deg)`,
                                    transition: isSpinning ? 'none' : 'transform 0.5s ease-out'
                                }}
                            >
                                <div className="wheel-section wheel-section-blue">
                                    <div className="wheel-section-content">
                                        <span className="player-name">{bluePlayer}</span>
                                        <span className="team-label">СИНЯЯ</span>
                                    </div>
                                </div>
                                <div className="wheel-section wheel-section-red">
                                    <div className="wheel-section-content">
                                        <span className="player-name">{redPlayer}</span>
                                        <span className="team-label">КРАСНАЯ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="team-result-popup">
                        <div className={`team-result-content ${winnerTeam}`}>
                            <h2>Ваша команда</h2>
                            <div className={`team-badge ${winnerTeam}`}>
                                {winnerTeam === 'red' ? 'КРАСНАЯ' : 'СИНЯЯ'}
                            </div>
                            <p>
                                Вы защищаете {winnerTeam === 'red' ? 'левую' : 'правую'} сторону поля
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamFortuneWheel; 