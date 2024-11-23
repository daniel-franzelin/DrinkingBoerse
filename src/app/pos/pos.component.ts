import {firstValueFrom, Subscriber, take} from 'rxjs';
import {DrinkService} from '../services/drink.service';
import {Drink} from './../../shared/drink';
import {Component, EventEmitter} from '@angular/core';
import {ObserversModule} from "@angular/cdk/observers";

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent extends ObserversModule {
  public drinks: Drink[] = [];
  salesCount: { [key: string]: number[] } = {}
  anzahlLabels: number = this.ds.getAnzahlLabels();


  constructor(protected ds: DrinkService) {
    super()
  }

  ngOnInit() {
    /*this.ds.drinks$.subscribe((drinks) => {
      this.drinks = drinks;
      for (const drinkKey in this.drinks) {
        this.salesCount[drinkKey] = this.salesCount[drinkKey] || 0; // Initialize if not present
      }
    });*/
    //this.ds.getDrinks().forEach(ele => this.salesCount[ele.name] = 0);
    this.ds.getDrinks().subscribe(drinks => this.drinks = drinks)
    this.loadDrinks()
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

  loadDrinks(): void {
    console.log('Subscribing to drinksChange')
    this.ds.drinksChange.subscribe(() => {
      console.log('emission received')
      console.log(JSON.parse(localStorage.getItem(this.ds.drinkKey) || '{}'))
    })
  }
}
