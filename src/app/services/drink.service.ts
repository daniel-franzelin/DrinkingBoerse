import {Injectable} from '@angular/core';
import {Drink} from 'src/shared/drink';
import {HttpClient} from '@angular/common/http';
import {DataService} from "./data.service";  // Import 'of' for localStorage case

@Injectable({
  providedIn: 'root'
})
export class DrinkService {
  private static ANZAHL_LABELS = 5;
  private static RELATIVE_GROWTH_THRESHOLD_TO_ADJUST_PRICE: number = 0.5
  private static USE_ALGORITHM_VERSION: number = 2

  private drinks!: Drink[];
  private salesCountMap!: Map<string, number[]>

  public intervalId: any;
  private priceDropArray: Drink[] = [];
  //private localKey = 'local';
  private syncTime = 1; // in min

  constructor(private http: HttpClient, private dataService: DataService) {
    this.dataService.drinks$.subscribe(value => {
      this.drinks = value
    })
    this.dataService.drinkSalesCountMap$.subscribe(value => {
      this.salesCountMap = value
    })
    this.startRefreshing();
  }

  ngOnInit() {

  }

  getDrinks(): Drink[] {
    return this.drinks
  }

  getAnzahlLabels() {
    return DrinkService.ANZAHL_LABELS
  }

  /**
   * Gives current saved value in DataService
   * To refresh from server, call DataService#refreshData() before get
   */
  getSalesCacheOfDrink(drinkName: string): number[] {
    return this.salesCountMap.get(drinkName) || []
  }

  /**
   * Gives current saved value in DataService
   * To refresh from server, call DataService#refreshData() before get
   */
  getSalesCountMap(): Map<string, number[]> {
    return this.salesCountMap
  }

  /*
  async updateSalesCountMap() {
    //return this.salesCountMap;
    console.log(this.salesCountObjectMap)
    if (this.fromLocalStorage) {
      return (JSON.parse(localStorage.getItem(this.salesCountKey) || '{}'));
    } else {
      const response = await firstValueFrom(this.http.get<any[]>(this.api + 'article-transaction/grouped-by-article'));


      const drinkPromises = response.map(async (item) => {
        console.log(item)
        const drink = await firstValueFrom(this.getDrinkByUUID(item.article_uuid));

        // Check if the drink is not yet in salesCountMap and initialize it
        if (!this.salesCountObjectMap[drink.name]) {
          this.salesCountObjectMap[drink.name] = Array(DrinkService.ANZAHL_LABELS + 1).fill(0);
        }

        // Update the sales count data
        this.salesCountObjectMap[drink.name].shift();
        this.salesCountObjectMap[drink.name].push(item.amount);
      });

      await Promise.all(drinkPromises);

      return this.salesCountObjectMap;

    }
  }
  */

  getTotalSales(): number {
    return DataService.sumOfNumberArray(
      Array.from(this.salesCountMap.values())
        .map(
          array => DataService.sumOfNumberArray(array)
        ))
  }

  setSyncTime(syncTime: number) {
    if (syncTime != undefined && syncTime > 0)
      this.syncTime = syncTime;
  }

  addDrink(drinkName: string, drinkPrice: number) {
    this.dataService.addDrink(drinkName, drinkPrice)
  }

  /**
   * Uses dataService to delete drink from database
   * @param drinkName
   */
  deleteDrink(drinkName: string) {
    this.dataService.deleteDrink(drinkName)
  }

  incrementSales(drinkName: string, amount?: number) {
    this.dataService.incrementSales(drinkName, amount)
  }

  /**
   * Repeatedly executes the handler function
   */
  startRefreshing() {
    this.intervalId = setInterval(() => {
      this.dataService.shiftSalesCacheHistory();
    }, this.syncTime * 60 * 1000); // 10 minutes in milliseconds
  }

  getSyncTime() {
    return this.syncTime;
  }

  /**
   * Returns price drop array (exists in drinkService)
   */
  getPriceChangeArray() {
    let ret = this.priceDropArray;
    this.priceDropArray = []; //TODO: emptying here seems unsecure
    return ret;
  }

  public async adjustPrices(): Promise<void> {
    switch (DrinkService.USE_ALGORITHM_VERSION) {
      case 1:
        await this.adjustPricesOfDrinksV2()
        break
      case 2:
        await this.adjustPricesOfDrinksV2()
        break
      default:
        await this.adjustPricesOfDrinksV2()
    }
  }

  /*
  public async adjustPricesV1() {
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
      const relativeSales = this.getSalesCountOfDrink(drink.name, DrinkService.ANZAHL_LABELS) / totalSales || 0; // Prevent division by zero
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
      if (drink.purchasePrice && newPrice < drink.purchasePrice * 1.2) {
        newPrice = this.roundPriceToNearestHalf(drink.purchasePrice * 1.2);
      } else if (drink.purchasePrice && newPrice > drink.purchasePrice * 5) {
        newPrice = this.roundPriceToNearestHalf(drink.purchasePrice * 5);
      }

      if (newPrice != drink.price)
        this.priceDropArray.push(drink)

      // Update the drink's base price
      console.log("New price for " + drink.name + ": " + newPrice);
      drink.price = parseFloat(newPrice.toFixed(2)); // Update to 2 decimal places
    }
  }
  */

  public async adjustPricesOfDrinksV2(): Promise<void> {
    const drinks: Drink[] = this.dataService.getAllDrinks();
    drinks.forEach((drink: Drink) => {
      console.log('Price of ' + drink.name + ' was: ' + this.dataService.getPriceOfDrink(drink.name))
      const newDrinkPrice = this.calculateNewDrinkPrice(drink)
      if (newDrinkPrice !== drink.price) {
        this.priceDropArray.push(drink)
        this.dataService.setPriceOfDrink(drink.name, parseFloat(newDrinkPrice.toFixed(2)))
      }
      console.log('Price of ' + drink.name + ' updated: ' + this.dataService.getPriceOfDrink(drink.name))
    })
  }

  private calculateNewDrinkPrice(drink: Drink): number {
    const minPrice = drink.purchasePrice ? drink.purchasePrice * 1.2 : 0.5 //TODO: No purchase price?
    const maxPrice = drink.purchasePrice ? drink.purchasePrice * 5 : 5 //TODO: No purchase price?

    let salesAtPreviousInterval = -1
    let salesAtCurrentInterval = -1

    if (this.dataService.getSalesDifferenceMap().has(drink.name)) {
      salesAtPreviousInterval = this.dataService.getSalesDifferenceMap().get(drink.name)![DrinkService.ANZAHL_LABELS - 2]
      salesAtCurrentInterval = this.dataService.getSalesDifferenceMap().get(drink.name)![DrinkService.ANZAHL_LABELS - 1]
    }

    const totalSalesFromPreviousInterval: number = Array.from(this.dataService.getSalesDifferenceMap().values())
      .map(arr => arr[DrinkService.ANZAHL_LABELS - 2] || 0)
      .reduce((acc, val) => acc + val, 0)
    const totalSalesFromCurrentInterval: number = Array.from(this.dataService.getSalesDifferenceMap().values())
      .map(arr => arr[DrinkService.ANZAHL_LABELS - 1] || 0)
      .reduce((acc, val) => acc + val, 0)

    const totalSalesGrowthFactor = (totalSalesFromCurrentInterval + 1) / (totalSalesFromPreviousInterval + 1) //+1 to prevent null division
    let salesGrowthFactor = 1
    if (!salesAtCurrentInterval) { //if no sales, decrease price
      salesGrowthFactor = DrinkService.RELATIVE_GROWTH_THRESHOLD_TO_ADJUST_PRICE
    } else if (salesAtPreviousInterval) {
      salesGrowthFactor = salesAtCurrentInterval / salesAtPreviousInterval
    } //if previous no sales and current has sales, leave price stagnant
    console.log('salesGrowthFactor of ' + drink.name + ' was ' + salesGrowthFactor)
    //normalise salesGrowth based on totalSalesGrowth
    salesGrowthFactor /= totalSalesGrowthFactor
    console.log('normalised salesGrowthFactor of ' + drink.name + ' was ' + salesGrowthFactor)
    console.log('relative growth threshold is set at ' + DrinkService.RELATIVE_GROWTH_THRESHOLD_TO_ADJUST_PRICE)
    const newDrinkPrice = this.mod(salesGrowthFactor - 1) >= DrinkService.RELATIVE_GROWTH_THRESHOLD_TO_ADJUST_PRICE //adjust price if distance to 1 is greater than threshold
      ? this.roundPriceToNearestHalf(drink.price * salesGrowthFactor)
      : this.roundPriceToNearestHalf(drink.price) //no change

    return newDrinkPrice < minPrice ? minPrice :
      newDrinkPrice > maxPrice ? maxPrice :
        newDrinkPrice
  }

  roundPriceToNearestHalf(price: number): number {
    // Multiply by 2, round to nearest integer, then divide by 2 to get nearest 0.5
    return Math.round(price * 2) / 2;
  }

  private mod(num: number): number {
    return num < 0 ? -num : num
  }

  parseObjectMapToMap(objectMap: { [drinkName: string]: number[] }): Map<string, number[]> {
    return new Map(Object.entries(objectMap))
  }
}

