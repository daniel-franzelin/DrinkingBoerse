import {Drink} from "../../shared/drink";
import {BehaviorSubject, map, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private useLocalStorage: boolean = true
  private api: string = "http://172.16.170.100:8888/api/";

  public static DRINK_KEY = 'drinkMap'
  public static SALES_COUNT_KEY = 'drinkSalesCount';
  public static CACHE_LENGTH = 5

  private drinks: BehaviorSubject<Drink[]>
  public readonly drinks$: Observable<Drink[]>

  /**
   * Saves sales history of the last 5 time intervals
   * Values are saved cumulatively
   * @private
   */
  private drinkSalesCountMap: BehaviorSubject<Map<string, number[]>>
  public readonly drinkSalesCountMap$: Observable<Map<string, number[]>>

  constructor(private http: HttpClient) {
    this.drinks = new BehaviorSubject<Drink[]>([])
    this.drinks$ = this.drinks.asObservable()
    this.drinkSalesCountMap = new BehaviorSubject<Map<string, number[]>>(new Map)
    this.drinkSalesCountMap$ = this.drinkSalesCountMap.asObservable()
  }

  /**
   * Gives current saved value in DataService
   * To refresh from server, call refreshData() before get
   */
  getAllDrinks(): Drink[] {
    return this.drinks.value
    //get from api
    /*
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
          if (!this.salesCountObjectMap[item.name])
            this.salesCountObjectMap[item.name] = Array(this.anzahlLabels + 1).fill(0);
          return ret;
        })
      })
    );
     */

  }

  /**
   * Gives current saved value in DataService
   * To refresh from server, call refreshData() before get
   */
  getAllSalesCountMap(): Map<string, number[]> {
    return this.drinkSalesCountMap.value
  }


  parseJSONMap(jsonMap: { [drinkName: string]: number[] }): Map<string, number[]> {
    return new Map(Object.entries(jsonMap))
  }

  /**
   * Creates a new type of drink locally and for server
   * Throws Error if drink with same name already exists
   * Beware shallow copy*
   * Shallow copies create a new structure of Map, however values are still referenced to the original values' memory storage
   * In this case not a problem, because a new key value pair is being created
   * @param drinkName
   * @param drinkPrice
   */
  addDrink(drinkName: string, drinkPrice: number): void {
    const tempMap = new Map(this.drinkSalesCountMap.value) //shallow copy*
    if (tempMap.has(drinkName)) {
      throw Error('Drink with name ' + drinkName + 'already exists')
    }
    tempMap.set(drinkName, Array(DataService.CACHE_LENGTH).fill(0))

    const newDrink = new Drink(drinkName, drinkPrice)
    const tempDrinks = [...this.drinks.value, newDrink]

    this.updateSalesCountMap(tempMap)
    this.updateDrinks(tempDrinks)
  }

  /**
   * Deletes drink from local and server
   * @param drinkName
   */
  deleteDrink(drinkName: string) {
    const tempDrinks = [...this.drinks.value]
    let index = -1
    for (let i = 0; i < tempDrinks.length; i++) {
      if (tempDrinks[i].name === drinkName) {
        index = i
        break;
      }
    }
    if (index === -1) {
      throw Error(drinkName + ' was not found in local drinks')
    }
    tempDrinks.splice(index, 1)
    const tempMap = new Map(this.drinkSalesCountMap.value)
    if (!tempMap.delete(drinkName)) {
      throw Error(drinkName + ' was not found in local map')
    }
    this.updateSalesCountMap(tempMap)
    this.updateDrinks(tempDrinks)
  }

  /**
   * Sets drinks locally and in server
   * @param newDrinks
   */
  private updateDrinks(newDrinks: Drink[]): void {
    this.drinks.next(newDrinks)
    if (this.useLocalStorage) {
      localStorage.setItem(DataService.DRINK_KEY, JSON.stringify(this.drinks.value))
    } else {
      //TODO
    }
  }

  /**
   * Sets salesCountMap locally and in server
   * @param newSalesCountMap
   */
  private updateSalesCountMap(newSalesCountMap: Map<string, number[]>): void {
    this.drinkSalesCountMap.next(newSalesCountMap)
    if (this.useLocalStorage) {
      localStorage.setItem(DataService.SALES_COUNT_KEY, JSON.stringify(this.drinkSalesCountMap.value))
    } else {
      //TODO
    }

  }

  /**
   * Refreshes drinks$, salesCountMap$ from server/local storage
   */
  async refreshData(): Promise<void> {
    if (this.useLocalStorage) {
      this.drinks.next(JSON.parse(localStorage.getItem(DataService.DRINK_KEY) || '{}'))
      this.drinkSalesCountMap.next(this.parseJSONMap(JSON.parse(localStorage.getItem(DataService.SALES_COUNT_KEY) || '{}')))
    } else {
      //TODO
    }
  }

  /**
   * Sets api to retrieve data from server
   * @param api to server
   */
  setFetchMethod(api: string) {
    console.log("Setting fetch method to " + api);
    this.useLocalStorage = false;
    this.api = api;
  }

  public static sumOfNumberArray(arr: number[]) {
    return arr.reduce((acc, val) => acc + val, 0)
  }

  /**
   * Retrieves Drink from server
   * @param uuid
   */
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

  /**
   * Increase last count in array of salesCount
   * @param drinkName name of drink that made a sale
   * @param amount number of sales to increase
   */
  incrementSales(drinkName: string, amount?: number) {
    if (!this.drinkSalesCountMap.value.has(drinkName)) {
      throw Error(drinkName + ' was not found in local map')
    }
    const tempMap = new Map(this.drinkSalesCountMap.value) //shallow copy
    const tempCacheHistory = tempMap.get(drinkName)

    if (tempCacheHistory && tempCacheHistory.length > 0) {
      const updatedCacheHistory = [...tempCacheHistory.splice(0, tempCacheHistory.length - 1),
        tempCacheHistory[tempCacheHistory.length - 1] + (amount ? amount : 1)
      ]
      tempMap.set(drinkName, updatedCacheHistory)
    }

    this.updateSalesCountMap(tempMap)
  }

  /**
   * Shifts all sales cache history to the left (first number removed)
   * and push the last number again
   */
  shiftSalesCacheHistory() {
    const tempMap = new Map(this.drinkSalesCountMap.value) //shallow copy
    tempMap.forEach((cacheHistory: number[], drinkName: string) => {
      const tempCacheHistory = [...cacheHistory]
      tempCacheHistory.shift()
      tempCacheHistory.push(tempCacheHistory[tempCacheHistory.length - 1])
      tempMap.set(drinkName, tempCacheHistory)
    })

    this.updateSalesCountMap(tempMap)
  }

  /**
   * Changes the price of the drink
   * @param drinkName
   * @param newPrice
   */
  setPriceOfDrink(drinkName: string, newPrice: number) {
    const tempDrinks = this.drinks.value
    const updatedDrinks = tempDrinks.map(drink => {
      if (drink.name === drinkName) {
        return {...drink, price: newPrice} as Drink
      } else {
        return drink
      }
    })
    this.updateDrinks(updatedDrinks)
  }

  /**
   * Returns price of drink from local
   * @param drinkName
   */
  getPriceOfDrink(drinkName: string): number {
    for (let i = 0; i < this.drinks.value.length; i++) {
      if (this.drinks.value[i].name === drinkName) {
        return this.drinks.value[i].price
      }
    }
    throw Error(drinkName + ' was not found in local drinks')
  }

  /**
   * Returns sales count history as array
   * @param drinkName
   */
  getSalesCountHistoryOfDrink(drinkName: string): number[] {
    return this.drinkSalesCountMap.value.get(drinkName) || []
  }

  /**
   * Returns last number of sales count history
   * Throws error if not found
   * @param drinkName
   */
  getTotalSalesCountOfDrink(drinkName: string): number {
    if (this.drinkSalesCountMap.value.has(drinkName)) {
      return this.drinkSalesCountMap.value.get(drinkName)![this.drinkSalesCountMap.value.get(drinkName)!.length - 1]
    } else {
      throw Error(drinkName + ' was not found in local map')
    }
  }
}
