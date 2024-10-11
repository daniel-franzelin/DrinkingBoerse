import { Injectable, OnInit } from '@angular/core';
import { Drink } from 'src/shared/drink';
//import { Drink } from 'src/shared/Drink';

@Injectable({
  providedIn: 'root'
})
export class DrinkService {
  private drinks: Drink[] = [];
  public intervalId: any;

  private salesCountMap: { [drinkName: string]: number[] } = {};
  private salesCountKey = 'drinkSalesCount';
  private drinkKey = 'drinkMap'
  private syncTime = 1; // in min
  private fromLocalStorage: boolean = true;
  private api: string = "";
  private anzahlLabels = 5;

  constructor() {
    this.startRefreshing();
   }

  ngOnInit() {
    this.drinks.forEach(drink => {
      this.salesCountMap[drink.name] = Array(this.anzahlLabels + 1).fill(0);
    });
    if(this.fromLocalStorage) {
      localStorage.setItem(this.salesCountKey, JSON.stringify(this.salesCountMap));
      localStorage.setItem(this.drinkKey, JSON.stringify(this.drinks));
    } else {
      //TODO implement else
    }
    this.startRefreshing();
  }

  setFetchMethod(api: string) {
    this.fromLocalStorage = true;
    this.api = api;
  }

  getDrinks(): Drink[] {
    if(this.fromLocalStorage)
      return JSON.parse(localStorage.getItem(this.drinkKey) || '{}');
    else
      //TODO
      throw Error
  }

  getAnzahlLabels() {
    return this.anzahlLabels
  }

  getSalesCountOfDrink(drinkName: string) {
    if(this.fromLocalStorage) {
      let sales = JSON.parse(localStorage.getItem(this.salesCountKey) || '{}');
      return sales[drinkName][this.anzahlLabels];
    } else
      throw Error
  }

  getSalesCountMap(): { [drinkName: string]: number[] } {
    //return this.salesCountMap;
    if(this.fromLocalStorage) {
      return JSON.parse(localStorage.getItem(this.salesCountKey) || '{}');
    } else
      throw Error
  }

  getSalesCountMapOfLocal(): { [drinkName: string]: number[] } {
    if(this.fromLocalStorage) {
      return JSON.parse(localStorage.getItem(this.salesCountKey) || '{}');
    } else
      throw Error
  }

  getTotalSales() {
    let ret = 0;
    let map = this.getSalesCountMap();
    for (let item in this.getSalesCountMap()) {
      ret += map[item][this.anzahlLabels];
    }
    return ret;
  }

  setSyncTime(syncTime: number) {
    if(syncTime != undefined && syncTime > 0)
      this.syncTime = syncTime;
  }

  addDrink(drinkname: string, drinkprice: string) {
    this.drinks.push(new Drink(drinkname, Number(drinkprice)));
    this.salesCountMap[drinkname] = Array(this.anzahlLabels +1).fill(0);
    if(this.fromLocalStorage) {
      localStorage.setItem(this.salesCountKey, JSON.stringify(this.salesCountMap)); // Update local storage
      localStorage.setItem(this.drinkKey, JSON.stringify(this.drinks));
    } else
      throw Error
  }

  deleteDrink(index: number) {
    this.drinks.splice(index, 1)
    //TODO: delete entry for drink in salescount map
    //this.salesCountMap
  }

  incrementSales(drinkname: string) {
    this.salesCountMap[drinkname][this.anzahlLabels]++;
    localStorage.setItem(this.salesCountKey, JSON.stringify(this.salesCountMap));
  }

  startRefreshing() {
    this.intervalId = setInterval(() => {
      this.updateSales();
      console.log(this.salesCountMap)

    }, this.syncTime * 60 * 1000); // 10 minutes in milliseconds
  }

  updateSales() {
    this.getDrinks().map(drink => {
      console.log(drink)
      //console.log(this.salesCount)
      this.salesCountMap[drink.name].shift(); //vorher war unten 3 also hab ich jetzt sozusagen auf 4
      this.salesCountMap[drink.name].push(this.salesCountMap[drink.name][this.anzahlLabels - 1]);
    })
    console.log(this.salesCountMap)
  }

  getSyncTime() {
    return this.syncTime;
  }

  private calculateTotalSales(): number {
    return this.drinks.reduce((total, drink) => total + this.getSalesCountOfDrink(drink.name), 0);
  }

  public adjustPrices(): void {
    const totalSales = this.calculateTotalSales();
    const drinkVariety = this.drinks.length;

    // Dynamic thresholds based on the number of drinks
    const increaseThreshold = drinkVariety * 0.05; // Increase threshold grows with drink variety
    const decreaseThreshold = drinkVariety * 0.02; // Decrease threshold grows with drink variety

    for (const drink of this.getDrinks()) {
      // Calculate the relative sales percentage
      const relativeSales = this.getSalesCountOfDrink(drink.name) / totalSales || 0; // Prevent division by zero

      // Determine the price change
      let priceChange = 0;

      if (relativeSales > increaseThreshold) {
        // Increase price if sales are above a certain threshold
        priceChange = 0.5; // Increase by 0.5
      } else if (relativeSales < decreaseThreshold) {
        // Decrease price if sales are very low
        priceChange = -0.5; // Decrease by 0.5
      }

      // Calculate the new price
      let newPrice = drink.price + priceChange;
      //TODO: put the algorithm to use
      // Ensure the new price is within min and max bounds
      /*if (newPrice < drink.minPrice) {
        newPrice = drink.minPrice;
      } else if (newPrice > drink.maxPrice) {
        newPrice = drink.maxPrice;
      }

      // Update the drink's base price
      drink.basePrice = parseFloat(newPrice.toFixed(2)); // Update to 2 decimal places*/
    }
  }
}
