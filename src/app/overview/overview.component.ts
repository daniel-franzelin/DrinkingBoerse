import { DrinkService } from './../drink.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Drink } from 'src/shared/drink';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {
  public drinks: Drink[] = [];
  private fromLocalStorage: boolean = true;
  protected checked: boolean = false;
  apiUrl: string = '';

  constructor(private ds: DrinkService, private router: Router) {
    ds.getDrinks().subscribe((drinks) => { this.drinks = drinks; });
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

  async updateDrinks() {
    this.drinks = await firstValueFrom(this.ds.getDrinks());
  }

  setToApi() {
    console.log("Setting to API");
    this.ds.setFetchMethod(this.apiUrl)
    this.router.navigate(['/chart']);
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
