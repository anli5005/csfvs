import { setLightness, getLuminance } from "polished";

const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export function validateColor(color) {
    return (color && colorRegex.test(color)) ? color : null;
}

export function lightColor(color) {
    return setLightness(Math.max(0.8, getLuminance(color)), color);
}
