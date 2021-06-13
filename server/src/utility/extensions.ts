export {};

declare global {
    interface Object {
        toBool(): boolean;
    }
}

Object.prototype.toBool = function () {
    if (!this) { return false; }
    return (this + '').toLowerCase() === "true";
};