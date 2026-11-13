/**
 * Ship skin rules. Pure.
 */
const ShipSkins = {
    isValid(id) {
        return SHIP_SKINS.some((s) => s.id === id);
    },

    resolve(saved) {
        return ShipSkins.isValid(saved) ? saved : DEFAULT_SHIP_SKIN;
    },

    colorOf(id) {
        const skin = SHIP_SKINS.find((s) => s.id === id);
        return (skin && skin.color) || GAME_CONFIG.shipColor;
    },
};
