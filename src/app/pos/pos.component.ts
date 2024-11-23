import {DrinkService} from '../services/drink.service';
import {Drink} from '../../shared/drink';
import {Component} from '@angular/core';
import {ObserversModule} from "@angular/cdk/observers";
import {DataService} from "../services/data.service";

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent extends ObserversModule {
  drinks!: Drink[];
  salesCountMap!: Map<string, number[]>


  constructor(readonly drinkService: DrinkService,
              readonly dataService: DataService) {
    super()
    this.dataService.drinks$.subscribe(value => {
      this.drinks = value
    })
    this.dataService.drinkSalesCountMap$.subscribe(value => {
      this.salesCountMap = value
    })
  }

  ngOnInit() {
    /*this.ds.drinks$.subscribe((drinks) => {
      this.drinks = drinks;
      for (const drinkKey in this.drinks) {
        this.salesCount[drinkKey] = this.salesCount[drinkKey] || 0; // Initialize if not present
      }
    });*/
    //this.ds.getDrinks().forEach(ele => this.salesCount[ele.name] = 0);
  }

  incrementSales(drinkName: string) {
    this.drinkService.incrementSales(drinkName)
  }

  /*
    async update() {
      this.drinks = await firstValueFrom(this.drinkService.getDrinks());
      console.log(this.drinks);
      this.salesCount = await this.drinkService.getSalesCountMap();

    }
   */
}
