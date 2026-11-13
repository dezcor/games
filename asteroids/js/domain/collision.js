/**
 * Circle-vs-circle overlap test. Pure.
 */
const CollisionRules = {
    overlaps(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.r || 2) + (obj2.r || 2);
    },
};
