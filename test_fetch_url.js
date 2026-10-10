const url = "https://maps.app.goo.gl/eG55N2dZk8sSgUaD8";
fetch(url).then(res => {
    console.log(res.url);
    const regex = /(?:@|q=|ll=)(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = res.url.match(regex);
    console.log(match);
}).catch(console.error);
