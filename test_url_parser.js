function extractCoordinatesFromUrl(url) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    const queryMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
    const llMatch = url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    return null;
}
console.log(extractCoordinatesFromUrl("https://www.google.com/maps/place/12%C2%B056'14.3%22N+77%C2%B036'31.7%22E/@12.9373056,77.6088056,17z"));
