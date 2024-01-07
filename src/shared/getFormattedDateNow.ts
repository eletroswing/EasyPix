export const getFormattedDateNow = (): string => {
    const gmt3 = new Date();
    const year = gmt3.getFullYear() + 1;
    const month = String(gmt3.getMonth() + 1).padStart(2, "0");
    const day = String(gmt3.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}