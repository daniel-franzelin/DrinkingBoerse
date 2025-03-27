import { Color } from "chart.js";

export class Drink {
  constructor(
    public name: string,
    public price: number,
    public uuid?: string,
    public purchasePrice?: number,
    public desc?: string,
    //public minPrice?: number,
    //public maxPrice?: number,
    public color?: Color
  ) {
    if (color == undefined) this.color = this.getRandomColor();
  }

  /*static empty() {
    return new Note(uuidv4(), '', '', moment().valueOf(), 0, null, null, false);
  }*/

  getRandomColor(): string {
    const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
    const saturation = Math.floor(Math.random() * 40 + 60); // Random saturation between 60% and 100%
    const lightness = Math.floor(Math.random() * 30 + 40); // Random lightness between 40% and 70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

}
