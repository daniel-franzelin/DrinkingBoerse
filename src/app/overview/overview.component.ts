import {DrinkService} from '../services/drink.service';
import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Drink} from 'src/shared/drink';
import {DataService} from "../services/data.service";

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {
  public drinks!: Drink[]
  public useAPI: boolean = false;
  apiUrl: string = '';

  addDrinkNameInput: string = ''
  addDrinkPriceInput: string = ''

  constructor(private readonly drinkService: DrinkService,
              private readonly router: Router,
              private readonly dataService: DataService) {
    this.dataService.drinks$.subscribe(value => {
      this.drinks = value
    })
  }

  addDrink(drinkName: string, drinkPrice: string) {
    if (drinkName && !isNaN(Number(drinkPrice))) {
      this.drinkService.addDrink(drinkName, Number(drinkPrice));
      this.clearInputFields();
    }
  }

  deleteDrink(drinkName: string) {
    this.drinkService.deleteDrink(drinkName);
  }

  setToApi() {
    console.log("Setting to API");
    this.dataService.setFetchMethod(this.apiUrl)
    this.router.navigate(['/chart'])
  }

  updateTime(syncTime: string) {
    let num = Number(syncTime)
    if (num > 0)
      this.drinkService.setSyncTime(num);
  }

  confirmAddDrink() {
    this.addDrink(this.addDrinkNameInput, this.addDrinkPriceInput); // Call the method to add drink
    this.clearInputFields()
  }

  clearInputFields() {
    this.addDrinkPriceInput = ''
    this.addDrinkNameInput = ''
  }
}
