
// Small utility - takes in an integer, returns a string
// representing that integer as a string of 8 hexadecimal
// numbers prepended by '0x'.
export default function hexpad(n) {
    return `0x${n.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function hexpad2(n) {
    return `0x${n.toString(16).toUpperCase().padStart(2, '0')}`;
}
