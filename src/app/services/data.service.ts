import {Drink} from "../../shared/drink";
import {map, of, take} from "rxjs";
import {HttpClient} from "@angular/common/http";

export class DataService {
  private useLocalStorage: boolean = true
  public static DRINK_KEY = 'drinkMap'
  public static SALES_COUNT_KEY = 'drinkSalesCount';

  constructor(private http: HttpClient) {

  }

  getDrinks(): Drink[] {
    if (this.useLocalStorage) {
      return JSON.parse(localStorage.getItem(DataService.DRINK_KEY) || '{}')
    } else {
      return []
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
  }

  getAllSalesCountMap(): Map<string, number[]> {
    if (this.useLocalStorage) {
      return this.parseJSONMap(JSON.parse(localStorage.getItem(DataService.SALES_COUNT_KEY) || '{}'));
    } else {
      return new Map;
    }
  }

  getSalesCountOfDrink(drinkName: string): number[] {
    return this.getAllSalesCountMap().get(drinkName) || []
  }

  parseJSONMap(jsonMap: { [drinkName: string]: number[] }): Map<string, number[]> {
    return new Map(Object.entries(jsonMap))
  }


}
