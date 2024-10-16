import { firstValueFrom } from 'rxjs';
import { DrinkService } from '../drink.service';
import { Drink } from './../../shared/drink';
import { Component } from '@angular/core';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent {
  public drinks: Drink[] = [];
  salesCount: { [key: string] : number[] } = {}
  anzahlLabels: number = this.ds.getAnzahlLabels();

  constructor(protected ds: DrinkService) {

  }

  ngOnInit() {
    /*this.ds.drinks$.subscribe((drinks) => {
      this.drinks = drinks;
      for (const drinkKey in this.drinks) {
        this.salesCount[drinkKey] = this.salesCount[drinkKey] || 0; // Initialize if not present
      }
    });*/
    //this.ds.getDrinks().forEach(ele => this.salesCount[ele.name] = 0);
    this.update();

  }

  incrementSales(drinkName: string) {
    this.ds.incrementSales(drinkName)
    this.update();
  }

  async update() {
    this.drinks = await firstValueFrom(this.ds.getDrinks());
    console.log(this.drinks);
    this.salesCount = await this.ds.getSalesCountMap();
  }

}
