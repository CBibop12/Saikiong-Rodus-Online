/* eslint-disable react/prop-types */

const ShopDistribution = ({
    matchState,
    teamTurn,
    manaDistribution,
    showManaDistribution,
    setShowManaDistribution,
    showRecipientSelection,
    setShowRecipientSelection,
    selectedItem,
    alliesNearStore,
    handleManaDistributionChange,
    handleManaDistributionNext,
    handleFinalizePurchase,
    selectedRecipient,
    setSelectedRecipient
}) => {
    const getEligibleRecipients = () => {
        return alliesNearStore().filter(ally => {
            if (selectedItem.type === "wearable") return true;
            return ally.inventory.length < ally.inventoryLimit;
        });
    }

    return (
        <div>
            {showManaDistribution && (
                <div className="store-modal-overlay">
                    <div className="store-modal-content">
                        <h3>Распределение маны</h3>
                        <p>Общая стоимость: {selectedItem.price}</p>
                        {Object.keys(manaDistribution).map(name => (
                            <div key={name} className="store-mana-distribution-row">
                                <span>{name} (Макс. мана: {matchState.teams[teamTurn].characters.find(ch => ch.name === name).currentMana})</span>
                                <input
                                    type="number"
                                    min="0"
                                    max={matchState.teams[teamTurn].characters.find(ch => ch.name === name).currentMana}
                                    value={manaDistribution[name]}
                                    onChange={(e) => handleManaDistributionChange(name, e.target.value)}
                                />
                            </div>
                        ))}
                        <div className="store-modal-actions">
                            <button onClick={() => setShowManaDistribution(false)}>Отмена</button>
                            <button onClick={handleManaDistributionNext}>Далее</button>
                        </div>
                    </div>
                </div>
            )}
            {showRecipientSelection && (
                <div className="store-modal-overlay">
                    <div className="store-modal-content">
                        <h3>Выбор получателя</h3>
                        <div className="store-recipient-list">
                            {getEligibleRecipients().map(ally => (
                                <div
                                    key={ally.name}
                                    className={`store-recipient-option ${selectedRecipient?.name === ally.name ? 'selected' : ''}`}
                                    onClick={() => setSelectedRecipient(ally)}
                                >
                                    <span>{ally.name}</span>
                                    {selectedItem.type !== "wearable" && (
                                        <span>(Инвентарь: {ally.inventory.length}/{ally.inventoryLimit})</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="store-modal-actions">
                            <button onClick={() => setShowRecipientSelection(false)}>Отмена</button>
                            <button onClick={handleFinalizePurchase} disabled={!selectedRecipient}>
                                Купить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopDistribution;