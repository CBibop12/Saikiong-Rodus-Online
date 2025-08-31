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
    setSelectedRecipient,
    store
}) => {
    const getEligibleRecipients = () => {
        return alliesNearStore().filter(ally => {
            if (selectedItem.type === "wearable") return true;
            return ally.inventory.length < ally.inventoryLimit;
        });
    }

    const variativeNextButtonName = () => {
        if (selectedItem.name === "Усиление урона") {
            return "Купить";
        } else {
            return "Далее";
        }
    }
    const variativeManaDistributionNextButtonName = () => {
        if (selectedItem.name === "Усиление урона") {
            return "Далее";
        } else {
            return "Купить";
        }
    }

    const handleVariativeNextButton = () => {
        if (selectedItem.name === "Усиление урона") {
            handleFinalizePurchase();
        } else {
            handleManaDistributionNext();
        }
    }

    const variativeManaDistributionNext = () => {
        setShowRecipientSelection(false);
        if (selectedItem.name === "Усиление урона") {
            handleManaDistributionNext();
            setShowManaDistribution(true);
        } else {
            handleFinalizePurchase();
        }
    }

    return (
        <div>
            {showRecipientSelection && (
                <div className="store-modal-overlay">
                    <div className="store-modal-content">
                        <h3>Выбор получателя</h3>
                        <div className="store-recipient-list">
                            {(() => {
                                const allies = alliesNearStore();
                                const totalMana = allies.reduce((s, a) => s + a.currentMana, 0);
                                return getEligibleRecipients().map(ally => {
                                    const isDamageBoost = selectedItem?.name === "Усиление урона";
                                    const required = isDamageBoost ? (ally.stats?.Мана || 0) : selectedItem.price;
                                    const affordable = isDamageBoost ? required <= totalMana : true;
                                    return (
                                        <div
                                            key={ally.name}
                                            className={`store-recipient-option ${selectedRecipient?.name === ally.name ? 'selected' : ''} ${isDamageBoost && !affordable ? 'disabled' : ''}`}
                                            onClick={() => (!isDamageBoost || affordable) && setSelectedRecipient(ally)}
                                            title={isDamageBoost && !affordable ? 'Недостаточно общей маны для 100% лимита получателя' : ''}
                                        >
                                            <span>{ally.name}</span>
                                            {selectedItem.type !== "wearable" && (
                                                <span>(Инвентарь: {ally.inventory.length}/{ally.inventoryLimit})</span>
                                            )}
                                            {isDamageBoost && (
                                                <span> (Цена: {ally.stats?.Мана || 0})</span>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        <div className="store-modal-actions">
                            <button onClick={() => setShowRecipientSelection(false)}>Отмена</button>
                            <button onClick={() => { variativeManaDistributionNext()}} disabled={!selectedRecipient}>{variativeManaDistributionNextButtonName()}</button>
                        </div>
                    </div>
                </div>
            )}
            {showManaDistribution && (
                <div className="store-modal-overlay">
                    <div className="store-modal-content">
                        <h3>Распределение маны</h3>
                        <p>Общая стоимость: {selectedItem?.name === 'Усиление урона' ? (selectedRecipient?.stats?.Мана || 0) : selectedItem.price}</p>
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
                            <button onClick={handleVariativeNextButton}>{variativeNextButtonName()}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopDistribution;