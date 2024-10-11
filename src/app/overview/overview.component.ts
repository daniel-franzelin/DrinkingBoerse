import { DrinkService } from './../drink.service';
import { Component } from '@angular/core';
import { Drink } from 'src/shared/drink';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {
  public drinks: Drink[];
  private fromLocalStorage: boolean = true;
  protected checked: boolean = false;//#endregion
  apiUrl: string = '';

  constructor(private ds: DrinkService) {
    this.drinks = ds.getDrinks();
  }

  addDrink(drinkname: string, drinkprice: string) {
    if (drinkname && !isNaN(Number(drinkprice))) {
      this.ds.addDrink(drinkname, drinkprice);
      this.updateDrinks();
      this.clearInputFields();
    }
  }

  deleteDrink(index: number) {
    this.ds.deleteDrink(index);
    this.updateDrinks();
  }

  updateDrinks() {
    this.drinks = this.ds.getDrinks();
  }

  setToApi() {
    this.ds.setFetchMethod(this.apiUrl)
  }

  updateTime(syncTime: string) {
    let num = Number(syncTime)
    if(num > 0)
      this.ds.setSyncTime(num);
  }

  onEnter(drinkName: string, drinkPrice: string) {
    this.addDrink(drinkName, drinkPrice); // Call the method to add drink
  }

  clearInputFields() {
    (document.querySelector('#drinkpriceref') as HTMLInputElement).value = '';
    (document.querySelector('#drinknameref') as HTMLInputElement).value = '';
  }
}
