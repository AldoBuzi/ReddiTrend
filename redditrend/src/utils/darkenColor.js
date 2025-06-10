export default function darkenColor(str, intensity) {
    let rgb = str.slice(4).slice(0, -1).split(",").map(char => parseInt(char))
    let r = rgb[0] - intensity
    let g = rgb[1] - intensity
    let b = rgb[2] - intensity
  
    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);
  
    return `rgb(${r}, ${g}, ${b})`
}