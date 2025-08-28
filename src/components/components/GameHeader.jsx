import React from 'react';
import "../../styles/gameHeader.css";
import GameTimer from './GameTimer';
const MAX_BASE_HP = 1500; // лучше вынести в константу

function hpPercentage(currentHP) {
    return `${(currentHP / MAX_BASE_HP * 100).toFixed(0)}%`;
}



const GameHeader = ({
    redHP,
    blueHP,
    redChars,
    blueChars,
    gameTime,
    onSelectCharacter,
}) => {
    console.log("GameHeader rerender");
    return (
        <div className="game-header">
            <div className="baseHp">
                <div className="baseHpBar red">
                    <div className="base-fill" style={{ width: hpPercentage(redHP) }}></div>
                    <div className="baseHp__hp">
                        {redHP}/{MAX_BASE_HP}
                    </div>
                </div>
            </div>
            <div className="characters-array red">
                {redChars.map((character, index) => (
                    <div className="header-character" onClick={() => { if (character.currentHP > 0) onSelectCharacter(character) }} key={index}>
                        <img
                            src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${character.image}`}
                            alt={character.name}
                            style={{
                                backgroundColor: "rgba(146, 45, 29, 0.5)",
                                filter: character.currentHP === 0 ? "grayscale(100%)" : "none"
                            }}
                        />
                    </div>
                ))}
            </div>
            <GameTimer gameTime={gameTime} />
            <div className="characters-array blue">
                {blueChars.map((character, index) => (
                    <div className="header-character" onClick={() => { if (character.currentHP > 0) onSelectCharacter(character) }} key={index}>
                        <img src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${character.image}`} alt={character.name} style={{ transform: 'scaleX(-1)', backgroundColor: "rgba(32, 99, 119, 0.5)" }} />
                    </div>
                ))}
            </div>
            <div className="baseHp">
                <div className="baseHpBar blue">
                    <div className="base-fill" style={{ width: hpPercentage(blueHP) }}></div>
                    <div className="baseHp__hp">
                        {blueHP}/{MAX_BASE_HP}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default React.memo(GameHeader);