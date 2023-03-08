export const timerTimeToSeconds = (
    seconds: number,
    minutes: number,
    hours: number,
    days: number
) => days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
