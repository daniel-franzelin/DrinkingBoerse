import { Injectable, OnInit } from '@angular/core';
import { Drink } from 'src/shared/drink';
//import { Drink } from 'src/shared/Drink';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, firstValueFrom } from 'rxjs';  // Import 'of' for localStorage case

@Injectable({
  providedIn: 'root'
})
export class DrinkService {
  private drinks: Drink[] = [];
  public intervalId: any;

  private salesCountMap: { [drinkName: string]: number[] } = {};
  private salesCountKey = 'drinkSalesCount';
  private priceDropArray: Drink[] = [];
  private drinkKey = 'drinkMap'
  //private localKey = 'local';
  private syncTime = 1; // in min
  private fromLocalStorage: boolean = true;
  private api: string = "http://172.16.170.100:8888/api/";
  private anzahlLabels = 5;

  constructor(private http: HttpClient) {
    this.updateSalesCountMap();
    this.startRefreshing();
   }

  ngOnInit() {
    this.drinks.forEach(drink => {
      this.salesCountMap[drink.name] = Array(this.anzahlLabels + 1).fill(0);
    });
    if(this.fromLocalStorage) {
      localStorage.setItem(this.salesCountKey, JSON.stringify(this.salesCountMap));
      localStorage.setItem(this.drinkKey, JSON.stringify(this.drinks));
      //localStorage.setItem(this.localKey, JSON.stringify(this.fromLocalStorage));
    } else {
      //TODO implement else
    }
    this.startRefreshing();
  }

  setFetchMethod(api: string) {
    console.log("Setting fetch method to " + api);
    this.fromLocalStorage = false;
    this.api = api;
  }

  isLocal() {
    return this.fromLocalStorage;
  }

  getDrinks(): Observable<Drink[]> {
    if(this.fromLocalStorage)
      return of(JSON.parse(localStorage.getItem(this.drinkKey) || '{}'));
    else {
      return this.http.get<any[]>(this.api + 'article/').pipe(
        map(response => {
          return response.map(item => {
            let ret = new Drink(
            item.name,
            item.resell_price,        // Map 'resell_price' to 'price'
            item.uuid,                // Optional field
            item.purchase_price,      // Optional field
            item.desc                 // Optional field
          )
          if(!this.salesCountMap[item.name])
            this.salesCountMap[item.name] = Array(this.anzahlLabels + 1).fill(0);
          return ret;
        })
        })
      );
    }
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

  getDrinkByUUID(uuid: string): Observable<Drink> {
    return this.http.get<any>(this.api + 'article/' + uuid).pipe(
      map(response => new Drink(
        response.name,
        response.resell_price,        // Map 'resell_price' to 'price'
        response.uuid,                // Optional field
        response.purchase_price,      // Optional field
        response.desc                 // Optional field
      ))
    );
  }

  getSalesCountMap() {
    if(this.fromLocalStorage) {
      return JSON.parse(localStorage.getItem(this.salesCountKey) || '{}');
    } else
      return this.salesCountMap;
  }

  async updateSalesCountMap(): Promise<{ [drinkName: string]: number[]; }> {
    //return this.salesCountMap;
    console.log(this.salesCountMap)
    if(this.fromLocalStorage) {
      return (JSON.parse(localStorage.getItem(this.salesCountKey) || '{}'));
    } else {
      const response = await firstValueFrom(this.http.get<any[]>(this.api + 'article-transaction/grouped-by-article'));


      const drinkPromises = response.map(async (item) => {
        console.log(item)
        const drink = await firstValueFrom(this.getDrinkByUUID(item.article_uuid));

        // Check if the drink is not yet in salesCountMap and initialize it
        if (!this.salesCountMap[drink.name]) {
            this.salesCountMap[drink.name] = Array(this.anzahlLabels + 1).fill(0);
        }

        // Update the sales count data
        this.salesCountMap[drink.name].shift();
        this.salesCountMap[drink.name].push(item.amount);
    });

    await Promise.all(drinkPromises);

    return this.salesCountMap;
    }
  }

  getSalesCountMapOfLocal(): { [drinkName: string]: number[] } {
    if(this.fromLocalStorage) {
      return JSON.parse(localStorage.getItem(this.salesCountKey) || '{}');
    } else
      throw Error
  }

  async getTotalSales() {
    let ret = 0;
    let map = await this.getSalesCountMap();
    for (let item in await this.getSalesCountMap()) {
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
    this.getDrinks().subscribe(drink => drink.forEach(drink => {
      console.log(drink)
      //console.log(this.salesCount)
      this.salesCountMap[drink.name].shift(); //vorher war unten 3 also hab ich jetzt sozusagen auf 4
      this.salesCountMap[drink.name].push(this.salesCountMap[drink.name][this.anzahlLabels - 1]);
    }))
    console.log(this.salesCountMap)
  }

  getSyncTime() {
    return this.syncTime;
  }

  private async calculateTotalSales(): Promise<number> {
    return (await firstValueFrom(this.getDrinks())).reduce((total, drink) => total + this.getSalesCountOfDrink(drink.name), 0)

  }

  getPriceDropArray() {
    let ret = this.priceDropArray;
    this.priceDropArray = [];
    return ret;
  }

  public async adjustPrices() {
    const totalSales = await this.calculateTotalSales();
    const drinkVariety = (await firstValueFrom(this.getDrinks())).length;
    console.log("Total sales: " + totalSales);
    // Dynamic thresholds based on the number of drinks
    const increaseThreshold = drinkVariety * 0.05; // Increase threshold grows with drink variety
    const decreaseThreshold = drinkVariety * 0.02; // Decrease threshold grows with drink variety
    console.log("Increase threshold: " + increaseThreshold);
    const drinks = await firstValueFrom(this.getDrinks());
    for (const drink of drinks) {
      // Calculate the relative sales percentage
      const relativeSales = this.getSalesCountOfDrink(drink.name) / totalSales || 0; // Prevent division by zero
      console.log("Relative sales for " + drink.name + ": " + relativeSales);
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
      if (drink.purchasePrice && newPrice < drink.purchasePrice * 1.2 ) {
        newPrice = this.roundPriceToNearestHalf(drink.purchasePrice * 1.2);
      } else if (drink.purchasePrice && newPrice > drink.purchasePrice * 5) {
        newPrice = this.roundPriceToNearestHalf(drink.purchasePrice * 5);
      }

      if(newPrice != drink.price)
        this.priceDropArray.push(drink)

      // Update the drink's base price
      console.log("New price for " + drink.name + ": " + newPrice);
      drink.price = parseFloat(newPrice.toFixed(2)); // Update to 2 decimal places*/
    }
  }

  roundPriceToNearestHalf(price: number): number {
    // Multiply by 2, round to nearest integer, then divide by 2 to get nearest 0.5
    return Math.round(price * 2) / 2;
  }
}
